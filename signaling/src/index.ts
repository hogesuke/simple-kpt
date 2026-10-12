import { DurableObject } from 'cloudflare:workers';

import { createConnectionState, handleMessage, isAllowedOrigin, LIMITS, parseRoomKey, type ConnectionState } from './relay';

interface Env {
  SIGNALING_ROOM: DurableObjectNamespace<SignalingRoom>;
  /** 接続を許可するOrigin（カンマ区切り） */
  ALLOWED_ORIGINS: string;
  /** 接続元IPアドレスごとの接続回数の制限（wrangler.jsoncのratelimitsで設定） */
  CONNECTION_RATE_LIMITER?: RateLimit;
}

/**
 * ルームごとのシグナリング中継
 *
 * WebSocket Hibernation APIを用いるため、メッセージを処理していない間はメモリから退避され、稼働時間が課金されない。
 * 接続ごとの状態（購読トピック・レート制限）はWebSocketのattachmentに保存し、退避後も復元できるようにする。
 * プライバシー保護のため、IPアドレスやメッセージの内容はログに出力しない。
 */
export class SignalingRoom extends DurableObject<Env> {
  async fetch(): Promise<Response> {
    if (this.ctx.getWebSockets().length >= LIMITS.maxConnections) {
      return new Response('Room is full', { status: 429 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(createConnectionState(Date.now()));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const state = ws.deserializeAttachment() as ConnectionState;
    const result = handleMessage(state, message, Date.now());
    ws.serializeAttachment(result.state);

    if (result.close) {
      ws.close(result.close.code, result.close.reason);
      return;
    }

    if (result.broadcast) {
      const { topic, data } = result.broadcast;
      for (const other of this.ctx.getWebSockets()) {
        if (other === ws) continue;
        const otherState = other.deserializeAttachment() as ConnectionState | null;
        if (otherState?.topics.includes(topic)) {
          try {
            other.send(data);
          } catch {
            // 切断処理中の接続への送信失敗は無視する
          }
        }
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      // すでに閉じている場合は何もしない
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomKey = parseRoomKey(url.pathname);
    if (!roomKey) {
      return new Response('Not Found', { status: 404 });
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (!isAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Originはブラウザ以外から偽装できるため、接続元IPアドレスごとに接続回数を制限して、無料枠を使い切られないようにする
    // （IPアドレスは制限の判定にのみ用い、記録しない）
    const clientIp = request.headers.get('CF-Connecting-IP');
    if (env.CONNECTION_RATE_LIMITER && clientIp) {
      const { success } = await env.CONNECTION_RATE_LIMITER.limit({ key: clientIp });
      if (!success) {
        return new Response('Too Many Requests', { status: 429 });
      }
    }

    // ルームキーごとに1つのDurable Objectで中継する
    const stub = env.SIGNALING_ROOM.get(env.SIGNALING_ROOM.idFromName(roomKey));
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
