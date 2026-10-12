import { describe, expect, it } from 'vitest';

import { buildSignalingRoomUrl, createRoomKey, parseServerMessage } from './signaling';

describe('createRoomKey', () => {
  it('64桁の16進数のルームキーを生成すること', async () => {
    expect(await createRoomKey('room-id', 'secret')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('同じルームIDと鍵からは同じルームキーを生成すること', async () => {
    expect(await createRoomKey('room-id', 'secret')).toBe(await createRoomKey('room-id', 'secret'));
  });

  it('鍵が異なるとルームキーも異なること（ルームIDだけではルームに接続できないこと）', async () => {
    expect(await createRoomKey('room-id', 'secret-a')).not.toBe(await createRoomKey('room-id', 'secret-b'));
  });

  it('ルームキーにルームIDや鍵がそのまま含まれないこと', async () => {
    const key = await createRoomKey('room-id', 'secret');
    expect(key).not.toContain('room-id');
    expect(key).not.toContain('secret');
  });
});

describe('buildSignalingRoomUrl', () => {
  it('シグナリングサーバーのルームのURLを組み立てること', () => {
    expect(buildSignalingRoomUrl('wss://signaling.example.com', 'abc')).toBe('wss://signaling.example.com/rooms/abc');
  });
});

describe('parseServerMessage', () => {
  it('正しい形式のメッセージを読み出すこと', () => {
    const payload = JSON.stringify({ peerId: 'abcDEF0123456789wxyz' });
    expect(parseServerMessage(JSON.stringify({ topic: 't', payload }))).toEqual({ topic: 't', payload });
  });

  it('不正な参加者IDを含むメッセージは捨てること', () => {
    for (const peerId of ['__proto__', 'constructor', 'a-b', '', 123]) {
      const payload = JSON.stringify({ peerId });
      expect(parseServerMessage(JSON.stringify({ topic: 't', payload }))).toBeNull();
    }
  });

  it('JSONでないメッセージや、形式の不正なメッセージは捨てること', () => {
    expect(parseServerMessage('not json')).toBeNull();
    expect(parseServerMessage(JSON.stringify({ topic: 1, payload: '{}' }))).toBeNull();
    expect(parseServerMessage(JSON.stringify({ topic: 't', payload: ['array'] }))).toBeNull();
    expect(parseServerMessage(JSON.stringify({ topic: 't', payload: 'not json' }))).toBeNull();
  });
});
