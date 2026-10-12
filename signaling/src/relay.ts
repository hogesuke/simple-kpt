/**
 * シグナリングの中継ロジック
 *
 * Trysteroのws-relay方式と同じメッセージ形式で、同じトピックを購読している接続にメッセージを転送する。
 * - クライアント → サーバー: { type: 'subscribe' | 'unsubscribe', topic } / { type: 'publish', topic, payload }
 * - サーバー → クライアント: { topic, payload }
 *
 * サーバーはメッセージの中身を解釈・保存しない（接続情報はクライアント側で暗号化されている）。
 * Durable ObjectのHibernation中も状態を保てるよう、接続ごとの状態はシリアライズ可能な値として扱う。
 */

export const LIMITS = {
  /** 1ルームあたりの最大接続数 */
  maxConnections: 50,
  /** 1メッセージの最大サイズ（文字数）。実測では最大約1.6KB（20人で接続した場合）のため、余裕を持たせて8KBとする */
  maxMessageLength: 8 * 1024,
  /** 1接続あたりの最大購読トピック数 */
  maxTopicsPerConnection: 8,
  /** トピックの最大文字数 */
  maxTopicLength: 128,
  /** レート制限の計測期間（ms） */
  rateLimitWindowMs: 10_000,
  /**
   * 計測期間内に受け付ける最大メッセージ数
   * 実測では1接続あたり「参加者数×約4.3件」を参加直後に送るため、最大人数（50人）でも収まるよう300件とする
   */
  rateLimitMaxMessages: 300,
} as const;

/** WebSocketのクローズコード（4000番台はアプリケーション定義） */
export const CLOSE_CODES = {
  invalidMessage: 4000,
  messageTooLarge: 4001,
  tooManyTopics: 4002,
  rateLimited: 4003,
} as const;

export interface ConnectionState {
  topics: string[];
  windowStartedAt: number;
  messageCount: number;
}

export type ClientMessage = { type: 'subscribe' | 'unsubscribe'; topic: string } | { type: 'publish'; topic: string; payload: unknown };

export interface HandleResult {
  state: ConnectionState;
  /** 同じトピックを購読している他の接続に転送するメッセージ */
  broadcast?: { topic: string; data: string };
  /** 接続を切断する場合の理由 */
  close?: { code: number; reason: string };
}

export function createConnectionState(now: number): ConnectionState {
  return { topics: [], windowStartedAt: now, messageCount: 0 };
}

function isValidTopic(topic: unknown): topic is string {
  return typeof topic === 'string' && topic.length > 0 && topic.length <= LIMITS.maxTopicLength;
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof json !== 'object' || json === null) return null;
  const { type, topic, payload } = json as Record<string, unknown>;
  if (!isValidTopic(topic)) return null;

  if (type === 'subscribe' || type === 'unsubscribe') return { type, topic };
  // Trysteroのペイロードは文字列（JSON）またはオブジェクト
  if (type === 'publish' && (typeof payload === 'string' || (typeof payload === 'object' && payload !== null))) {
    return { type, topic, payload };
  }
  return null;
}

/**
 * 1接続から受信したメッセージを処理する
 */
export function handleMessage(state: ConnectionState, raw: string | ArrayBuffer, now: number): HandleResult {
  // レート制限（計測期間ごとにメッセージ数を数える）
  const isNewWindow = now - state.windowStartedAt >= LIMITS.rateLimitWindowMs;
  const nextState: ConnectionState = {
    topics: state.topics,
    windowStartedAt: isNewWindow ? now : state.windowStartedAt,
    messageCount: (isNewWindow ? 0 : state.messageCount) + 1,
  };
  if (nextState.messageCount > LIMITS.rateLimitMaxMessages) {
    return { state: nextState, close: { code: CLOSE_CODES.rateLimited, reason: 'rate limited' } };
  }

  if (typeof raw !== 'string') {
    return { state: nextState, close: { code: CLOSE_CODES.invalidMessage, reason: 'binary messages are not supported' } };
  }
  if (raw.length > LIMITS.maxMessageLength) {
    return { state: nextState, close: { code: CLOSE_CODES.messageTooLarge, reason: 'message too large' } };
  }

  const message = parseClientMessage(raw);
  if (!message) {
    return { state: nextState, close: { code: CLOSE_CODES.invalidMessage, reason: 'invalid message' } };
  }

  switch (message.type) {
    case 'subscribe': {
      if (nextState.topics.includes(message.topic)) return { state: nextState };
      if (nextState.topics.length >= LIMITS.maxTopicsPerConnection) {
        return { state: nextState, close: { code: CLOSE_CODES.tooManyTopics, reason: 'too many topics' } };
      }
      return { state: { ...nextState, topics: [...nextState.topics, message.topic] } };
    }
    case 'unsubscribe':
      return { state: { ...nextState, topics: nextState.topics.filter((topic) => topic !== message.topic) } };
    case 'publish':
      return {
        state: nextState,
        broadcast: { topic: message.topic, data: JSON.stringify({ topic: message.topic, payload: message.payload }) },
      };
  }
}

/**
 * 接続元のOriginが許可されているか判定する
 * @param allowedOrigins カンマ区切りの許可Origin一覧
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string): boolean {
  if (!origin) return false;
  return allowedOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

/** ルームキー（ルームIDのSHA-256ハッシュ値） */
const ROOM_KEY_REGEX = /^[0-9a-f]{64}$/;

/**
 * リクエストのパス（/rooms/<ルームキー>）からルームキーを取り出す
 */
export function parseRoomKey(pathname: string): string | null {
  const match = /^\/rooms\/([^/]+)$/.exec(pathname);
  return match && ROOM_KEY_REGEX.test(match[1]) ? match[1] : null;
}
