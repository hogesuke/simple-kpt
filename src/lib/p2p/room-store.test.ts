import { describe, expect, it } from 'vitest';

import { MAX_STORED_ROOMS, ROOM_RETENTION_DAYS, selectRoomsToPrune } from './room-store';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 11);

describe('selectRoomsToPrune', () => {
  it('保持期間内のルームは削除しないこと', () => {
    const rooms = [{ roomId: 'recent', updatedAt: NOW - (ROOM_RETENTION_DAYS - 1) * DAY_MS }];
    expect(selectRoomsToPrune(rooms, NOW)).toEqual([]);
  });

  it('保持期間を過ぎたルームを削除すること', () => {
    const rooms = [
      { roomId: 'recent', updatedAt: NOW - DAY_MS },
      { roomId: 'expired', updatedAt: NOW - (ROOM_RETENTION_DAYS + 1) * DAY_MS },
    ];
    expect(selectRoomsToPrune(rooms, NOW)).toEqual(['expired']);
  });

  it('最大数を超えた場合は古いルームから削除すること', () => {
    const rooms = Array.from({ length: MAX_STORED_ROOMS + 2 }, (_, i) => ({ roomId: `room-${i}`, updatedAt: NOW - i * 1000 }));
    expect(selectRoomsToPrune(rooms, NOW)).toEqual([`room-${MAX_STORED_ROOMS}`, `room-${MAX_STORED_ROOMS + 1}`]);
  });

  it('ルームがない場合は何も削除しないこと', () => {
    expect(selectRoomsToPrune([], NOW)).toEqual([]);
  });
});
