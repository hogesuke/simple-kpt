import { describe, expect, it } from 'vitest';

import { buildAssigneeOptions } from './assignee-options';

import type { BoardMember, KptItem } from '@/types/kpt';

const member = (userId: string, nickname: string): BoardMember => ({ id: userId, userId, nickname, role: 'member', createdAt: '' });

const item = (overrides: Partial<KptItem>): KptItem => ({
  id: crypto.randomUUID(),
  boardId: 'room',
  column: 'try',
  text: 'Try',
  position: 1000,
  authorId: null,
  ...overrides,
});

describe('buildAssigneeOptions', () => {
  it('接続中の参加者を接続中として先頭に並べること', () => {
    const options = buildAssigneeOptions([member('a', '山田')], []);
    expect(options).toEqual([{ userId: 'a', nickname: '山田', isConnected: true }]);
  });

  it('接続していない担当者・作成者・投票者を未接続として含めること', () => {
    const items = [
      item({ assigneeId: 'sato', assigneeNickname: '佐藤', authorId: 'a', authorNickname: '山田' }),
      item({ authorId: 'suzuki', authorNickname: '鈴木', voters: [{ id: 'tanaka', nickname: '田中' }] }),
    ];

    const options = buildAssigneeOptions([member('a', '山田')], items);

    expect(options[0]).toEqual({ userId: 'a', nickname: '山田', isConnected: true });
    expect(options.slice(1).map((o) => [o.nickname, o.isConnected])).toEqual(
      expect.arrayContaining([
        ['佐藤', false],
        ['鈴木', false],
        ['田中', false],
      ])
    );
    expect(options).toHaveLength(4);
  });

  it('接続中の参加者は、カードに古い名前が残っていても接続中の名前で1件にまとめること', () => {
    const items = [item({ assigneeId: 'a', assigneeNickname: '古い名前' })];
    expect(buildAssigneeOptions([member('a', '新しい名前')], items)).toEqual([{ userId: 'a', nickname: '新しい名前', isConnected: true }]);
  });

  it('同じ人が複数のカードに登場しても1件にまとめること', () => {
    const items = [item({ assigneeId: 'sato', assigneeNickname: '佐藤' }), item({ authorId: 'sato', authorNickname: '佐藤' })];
    expect(buildAssigneeOptions([], items)).toEqual([{ userId: 'sato', nickname: '佐藤', isConnected: false }]);
  });
});
