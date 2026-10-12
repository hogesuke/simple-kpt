import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { P2PRoom } from './p2p-room';

/*
 * 接続中の参加者とのやりとりをモックして、ルーム時計の同期とエクスポート状態の共有を確認する
 */

/** 接続中の参加者のpeerId */
let peerIds: string[] = [];
/** ルーム時刻の問い合わせへの回答 */
let respondRoomTime: (peerId: string) => number | null = () => null;
/** 参加イベントのハンドラ（後から参加する参加者を再現するため） */
let handlePeerJoin: ((peerId: string) => void) | null = null;
/** 送信したエクスポート状態 */
const sentExports: unknown[] = [];

vi.mock('@trystero-p2p/core', () => ({ selfId: 'zzzzzzzzzzzzzzzzzzzz' }));
vi.mock('./signaling', () => ({
  joinRoom: () => ({
    makeAction: (name: string) => ({
      send: async (payload: unknown) => {
        if (name === 'exported') sentExports.push(payload);
      },
      request: (_: number, { target }: { target: string }) =>
        new Promise((resolve) => setTimeout(() => resolve({ roomTime: respondRoomTime(target) }), 50)),
    }),
    getPeers: () => Object.fromEntries(peerIds.map((peerId) => [peerId, {}])),
    leave: async () => {},
    set onPeerJoin(handler: (peerId: string) => void) {
      handlePeerJoin = handler;
      // 接続中の参加者が、接続の直後に参加したものとして扱う
      setTimeout(() => peerIds.forEach((peerId) => handler(peerId)), 0);
    },
    set onPeerLeave(_handler: unknown) {},
  }),
}));

const createRoom = () =>
  new P2PRoom({
    roomId: 'room',
    secret: 'secret',
    userId: 'me',
    nickname: '自分',
    isClockReference: false,
    signalingRoomKey: 'key',
    signalingRoomUrl: 'ws://localhost/rooms/key',
  });

describe('P2PRoom（ルーム時計の同期）', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ['回答しない参加者と、未同期の参加者1人', ['00000000000000000000', 'hhhhhhhhhhhhhhhhhhh1']],
    ['回答しない参加者と、未同期の参加者2人', ['00000000000000000000', 'hhhhhhhhhhhhhhhhhhh1', 'hhhhhhhhhhhhhhhhhhh2']],
    ['未同期の参加者2人と、後ろにいる回答しない参加者', ['hhhhhhhhhhhhhhhhhhh1', 'hhhhhhhhhhhhhhhhhhh2', '00000000000000000000']],
  ])('時刻を得られない状態が続くと、自分の時計を基準にすること（%s）', async (_label, peers) => {
    peerIds = peers;
    respondRoomTime = () => null;
    const room = createRoom();
    room.connect();

    await vi.advanceTimersByTimeAsync(120_000);
    expect(room.clock.isSynced()).toBe(true);
    room.destroy();
  });

  it('最小のIDの参加者が遅れて参加して基準になった場合は、自分も基準にならずにその時計に合わせること', async () => {
    const LATE_JOIN_MS = 6500;
    const REFERENCE_OFFSET_MS = 100_000;
    // 未同期の参加者（自分より小さいID）と2人で開き直した後、さらに小さいIDの参加者が遅れて参加し、その8秒後に基準になる
    peerIds = ['cccccccccccccccccccc'];
    const startedAt = Date.now();
    respondRoomTime = (peerId) =>
      peerId === 'aaaaaaaaaaaaaaaaaaaa' && Date.now() - startedAt >= LATE_JOIN_MS + 8000 ? Date.now() + REFERENCE_OFFSET_MS : null;
    const room = createRoom();
    room.connect();

    await vi.advanceTimersByTimeAsync(LATE_JOIN_MS);
    peerIds = ['aaaaaaaaaaaaaaaaaaaa', 'cccccccccccccccccccc'];
    handlePeerJoin?.('aaaaaaaaaaaaaaaaaaaa');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(room.clock.isSynced()).toBe(true);
    expect(Math.abs(room.clock.now() - Date.now() - REFERENCE_OFFSET_MS)).toBeLessThan(1000);
    room.destroy();
  });
});

describe('P2PRoom（ルーム時計の同期前のエクスポート）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sentExports.length = 0;
  });
  afterEach(() => vi.useRealTimers());

  it('端末の時計が進んでいても、同期した時点でルーム時刻を付けて他の参加者に知らせること', async () => {
    peerIds = ['aaaaaaaaaaaaaaaaaaaa'];
    // 相手のルーム時刻は、自分の端末の時計より1時間遅い
    respondRoomTime = () => Date.now() - 60 * 60 * 1000;
    const room = createRoom();
    room.connect();
    room.markExported();
    expect(sentExports).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(room.clock.isSynced()).toBe(true);
    expect(sentExports).toHaveLength(1);
    const { exportedAt } = sentExports[0] as { exportedAt: number };
    expect(Math.abs(exportedAt - room.clock.now())).toBeLessThan(10_000);
    room.destroy();
  });
});
