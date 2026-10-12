import { describe, expect, it } from 'vitest';

import { estimateOffset, RoomClock } from './room-clock';

describe('estimateOffset', () => {
  it('計測結果がない場合、nullを返すこと', () => {
    expect(estimateOffset([])).toBeNull();
  });

  it('往復時間の中間時刻を基準に時刻差を推定すること', () => {
    // 送信1000、受信1100（片道50ms）、回答者のルーム時刻は6050 → 時刻差は5000
    expect(estimateOffset([{ sentAt: 1000, receivedAt: 1100, remoteTime: 6050 }])).toBe(5000);
  });

  it('往復時間が最も短い計測結果を採用すること', () => {
    const samples = [
      { sentAt: 0, receivedAt: 400, remoteTime: 5300 },
      { sentAt: 1000, receivedAt: 1020, remoteTime: 6010 },
      { sentAt: 2000, receivedAt: 2200, remoteTime: 7000 },
    ];
    expect(estimateOffset(samples)).toBe(5000);
  });

  it('受信時刻が送信時刻より前の不正な計測結果を除外すること', () => {
    expect(estimateOffset([{ sentAt: 1000, receivedAt: 900, remoteTime: 0 }])).toBeNull();
  });
});

describe('RoomClock', () => {
  it('初期状態では未同期であること', () => {
    const clock = new RoomClock(() => 1000);
    expect(clock.isSynced()).toBe(false);
  });

  it('基準になった場合、ローカル時刻をそのままルーム時刻とすること', () => {
    const clock = new RoomClock(() => 1000);
    clock.markAsReference();
    expect(clock.isSynced()).toBe(true);
    expect(clock.now()).toBe(1000);
  });

  it('計測結果を適用した場合、時刻差を加えた時刻をルーム時刻とすること', () => {
    const clock = new RoomClock(() => 2000);
    expect(clock.applySamples([{ sentAt: 1000, receivedAt: 1100, remoteTime: 6050 }])).toBe(true);
    expect(clock.isSynced()).toBe(true);
    expect(clock.now()).toBe(7000);
  });

  it('ルーム時刻をローカル時刻に変換できること', () => {
    const clock = new RoomClock(() => 2000);
    clock.applySamples([{ sentAt: 1000, receivedAt: 1100, remoteTime: 6050 }]);
    expect(clock.toLocalTime(7000)).toBe(2000);
  });

  it('有効な計測結果がない場合、未同期のままであること', () => {
    const clock = new RoomClock(() => 2000);
    expect(clock.applySamples([])).toBe(false);
    expect(clock.isSynced()).toBe(false);
  });
});
