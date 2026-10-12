import { createRelayManager, createTopicStrategy, makeSocket, toJson } from '@trystero-p2p/core';

import type { JoinRoom, SocketClient, StrategyMessage } from '@trystero-p2p/core';

/**
 * 自前のシグナリングサーバー（Cloudflare Workers）を用いるTrysteroの接続方式
 *
 * Trysteroのws-relay方式（@trystero-p2p/ws-relay、MIT License）のクライアントと同じメッセージ形式で通信する。
 * ws-relay方式との違いは、参加の再通知の間隔のみ。
 * Trysteroの標準では接続後も1分ごとに参加を再通知するが、新しい参加者の通知は既存の参加者に必ず届くため、
 * 再通知は参加時と再接続時に限定する。これにより、シグナリングサーバーがHibernationで待機できる時間を確保する。
 */

/** 参加の再通知の間隔（参加時・再接続時の通知に失敗した場合の保険として、長めの間隔で再通知する） */
const STEADY_ANNOUNCE_INTERVAL_MS = 10 * 60 * 1000;

/** ローカル開発時のシグナリングサーバー（`pnpm signaling:dev`で起動する） */
const LOCAL_SIGNALING_URL = 'ws://localhost:8787';

export function getSignalingUrl(): string {
  const url = import.meta.env.VITE_SIGNALING_URL;
  if (url) return url.replace(/\/$/, '');
  if (import.meta.env.DEV) return LOCAL_SIGNALING_URL;
  throw new Error('VITE_SIGNALING_URLが設定されていません');
}

/**
 * ルームIDと招待URLの鍵から、シグナリングサーバー上のルームキーを生成する
 * - ルームIDそのものをシグナリングサーバーに送信しないよう、ハッシュ値を用いる
 * - 鍵も含めることで、ルームID（URLのパス）だけを知っていても、シグナリングサーバーのルームに接続できないようにする
 * このキーはTrysteroのルームIDとしても用いる（Trysteroのトピックは鍵を含まずルームIDから作られるため）
 */
export async function createRoomKey(roomId: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`simple-kpt:${roomId}:${secret}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildSignalingRoomUrl(signalingUrl: string, roomKey: string): string {
  return `${signalingUrl}/rooms/${roomKey}`;
}

type TopicHandler = (topic: string, payload: StrategyMessage) => void;

const relayManager = createRelayManager<SocketClient>((client) => client.socket);
const topicHandlers = relayManager.scoped<Set<TopicHandler>>();
const announcements = relayManager.scoped<StrategyMessage>();

/**
 * TrysteroのpeerIdの形式（英数字20文字）
 * __proto__やconstructorのような値を、Trystero内部でオブジェクトのキーとして使わせないようにする
 */
const PEER_ID_REGEX = /^[A-Za-z0-9]{20}$/;

/**
 * シグナリングサーバーから届いたメッセージを検証して読み出す
 * 他の参加者が送った内容がそのまま届くため、形式と参加者ID（peerId）を検証する
 */
export const parseServerMessage = (data: string): { topic: string; payload: StrategyMessage } | null => {
  try {
    const message = JSON.parse(data) as { topic?: unknown; payload?: unknown };
    const { topic, payload } = message;
    if (typeof topic !== 'string') return null;
    if (typeof payload !== 'string' && (typeof payload !== 'object' || payload === null || Array.isArray(payload))) return null;

    const body: unknown = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (typeof body === 'object' && body !== null && 'peerId' in body) {
      const { peerId } = body as { peerId: unknown };
      if (typeof peerId !== 'string' || !PEER_ID_REGEX.test(peerId)) return null;
    }
    return { topic, payload: payload as StrategyMessage };
  } catch {
    return null;
  }
};

export const joinRoom: JoinRoom = createTopicStrategy<SocketClient>({
  steadyAnnounceIntervalMs: STEADY_ANNOUNCE_INTERVAL_MS,
  init: (config) =>
    (config.relayConfig?.urls ?? []).map((url) => {
      const client = relayManager.register(url, () =>
        makeSocket(
          url,
          (data) => {
            const message = parseServerMessage(data);
            if (!message) return;
            topicHandlers.forRelay(client)[message.topic]?.forEach((handler) => handler(message.topic, message.payload));
          },
          () => {
            // 再接続時に購読と参加の通知をやり直す
            Object.keys(topicHandlers.forKey(url)).forEach((topic) => client.send(toJson({ type: 'subscribe', topic })));
            Object.entries(announcements.forKey(url)).forEach(([topic, payload]) =>
              client.send(toJson({ type: 'publish', topic, payload }))
            );
          }
        )
      );
      return client.ready;
    }),
  subscribeTopic: (client, topic, onMessage) => {
    const handlers = topicHandlers.forRelay(client);
    const handler: TopicHandler = (receivedTopic, payload) => void onMessage(receivedTopic, payload);
    const isFirstSubscription = !handlers[topic];
    (handlers[topic] ??= new Set()).add(handler);
    if (isFirstSubscription) client.send(toJson({ type: 'subscribe', topic }));

    return () => {
      const current = handlers[topic];
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        delete handlers[topic];
        delete announcements.forRelay(client)[topic];
        client.send(toJson({ type: 'unsubscribe', topic }));
      }
    };
  },
  publishTopic: (client, topic, payload, { kind }) => {
    client.send(toJson({ type: 'publish', topic, payload }));
    if (kind === 'announce') announcements.forRelay(client)[topic] = payload;
  },
});
