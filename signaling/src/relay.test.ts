import { describe, expect, it } from 'vitest';

import { CLOSE_CODES, createConnectionState, handleMessage, isAllowedOrigin, LIMITS, parseRoomKey } from './relay';

const NOW = 1_000_000;
const TOPIC = 'a'.repeat(40);

const send = (message: unknown) => JSON.stringify(message);

describe('handleMessage', () => {
  it('購読したトピックを接続の状態に追加すること', () => {
    const result = handleMessage(createConnectionState(NOW), send({ type: 'subscribe', topic: TOPIC }), NOW);
    expect(result.state.topics).toEqual([TOPIC]);
    expect(result.close).toBeUndefined();
  });

  it('同じトピックを重複して購読しないこと', () => {
    let state = createConnectionState(NOW);
    state = handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW).state;
    state = handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW).state;
    expect(state.topics).toEqual([TOPIC]);
  });

  it('購読解除したトピックを接続の状態から削除すること', () => {
    let state = createConnectionState(NOW);
    state = handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW).state;
    state = handleMessage(state, send({ type: 'unsubscribe', topic: TOPIC }), NOW).state;
    expect(state.topics).toEqual([]);
  });

  it('publishしたメッセージをトピックとペイロードの形式で転送すること', () => {
    const payload = '{"peerId":"abc"}';
    const result = handleMessage(createConnectionState(NOW), send({ type: 'publish', topic: TOPIC, payload }), NOW);
    expect(result.broadcast).toEqual({ topic: TOPIC, data: JSON.stringify({ topic: TOPIC, payload }) });
  });

  it('不正な形式のメッセージを受信した場合は切断すること', () => {
    for (const raw of [
      'not json',
      send({ type: 'unknown', topic: TOPIC }),
      send({ type: 'subscribe' }),
      send({ type: 'publish', topic: TOPIC }),
    ]) {
      expect(handleMessage(createConnectionState(NOW), raw, NOW).close?.code).toBe(CLOSE_CODES.invalidMessage);
    }
  });

  it('バイナリのメッセージを受信した場合は切断すること', () => {
    expect(handleMessage(createConnectionState(NOW), new ArrayBuffer(8), NOW).close?.code).toBe(CLOSE_CODES.invalidMessage);
  });

  it('トピックが長すぎる場合は切断すること', () => {
    const raw = send({ type: 'subscribe', topic: 'a'.repeat(LIMITS.maxTopicLength + 1) });
    expect(handleMessage(createConnectionState(NOW), raw, NOW).close?.code).toBe(CLOSE_CODES.invalidMessage);
  });

  it('メッセージが大きすぎる場合は切断すること', () => {
    const raw = send({ type: 'publish', topic: TOPIC, payload: 'a'.repeat(LIMITS.maxMessageLength) });
    expect(handleMessage(createConnectionState(NOW), raw, NOW).close?.code).toBe(CLOSE_CODES.messageTooLarge);
  });

  it('購読トピック数が上限を超える場合は切断すること', () => {
    let state = createConnectionState(NOW);
    for (let i = 0; i < LIMITS.maxTopicsPerConnection; i++) {
      state = handleMessage(state, send({ type: 'subscribe', topic: `topic-${i}` }), NOW).state;
    }
    const result = handleMessage(state, send({ type: 'subscribe', topic: 'one-more' }), NOW);
    expect(result.close?.code).toBe(CLOSE_CODES.tooManyTopics);
  });

  it('計測期間内のメッセージ数が上限を超える場合は切断すること', () => {
    let state = createConnectionState(NOW);
    for (let i = 0; i < LIMITS.rateLimitMaxMessages; i++) {
      const result = handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW);
      expect(result.close).toBeUndefined();
      state = result.state;
    }
    expect(handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW).close?.code).toBe(CLOSE_CODES.rateLimited);
  });

  it('計測期間が過ぎた場合はメッセージ数をリセットすること', () => {
    const state = { ...createConnectionState(NOW), messageCount: LIMITS.rateLimitMaxMessages };
    const result = handleMessage(state, send({ type: 'subscribe', topic: TOPIC }), NOW + LIMITS.rateLimitWindowMs);
    expect(result.close).toBeUndefined();
    expect(result.state.messageCount).toBe(1);
  });
});

describe('isAllowedOrigin', () => {
  it('許可されたOriginの場合はtrueを返すこと', () => {
    expect(isAllowedOrigin('https://simple-kpt.example', 'http://localhost:5173, https://simple-kpt.example')).toBe(true);
  });

  it('許可されていないOriginの場合はfalseを返すこと', () => {
    expect(isAllowedOrigin('https://evil.example', 'https://simple-kpt.example')).toBe(false);
  });

  it('Originがない場合はfalseを返すこと', () => {
    expect(isAllowedOrigin(null, 'https://simple-kpt.example')).toBe(false);
  });
});

describe('parseRoomKey', () => {
  it('パスからルームキーを取り出すこと', () => {
    const key = 'f'.repeat(64);
    expect(parseRoomKey(`/rooms/${key}`)).toBe(key);
  });

  it('ルームキーの形式が不正な場合はnullを返すこと', () => {
    expect(parseRoomKey('/rooms/not-a-hash')).toBeNull();
    expect(parseRoomKey(`/rooms/${'F'.repeat(64)}`)).toBeNull();
    expect(parseRoomKey('/')).toBeNull();
  });
});
