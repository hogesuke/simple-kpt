import { describe, expect, it } from 'vitest';

import { MAX_ITEMS_PER_BOARD } from '@shared/constants';

import {
  createBoardFile,
  InvalidBoardFileError,
  listFileParticipants,
  parseBoardFile,
  reassignParticipant,
  serializeBoardFile,
} from './board-file';

import type { KptItem } from '@/types/kpt';

const ITEMS: KptItem[] = [
  {
    id: 'item-1',
    boardId: 'room',
    column: 'keep',
    text: '良かったこと',
    position: 1000,
    authorId: 'user-a',
    authorNickname: 'A',
    createdAt: '2026-10-01T10:00:00.000Z',
    voteCount: 1,
    hasVoted: false,
    voters: [{ id: 'user-b', nickname: 'B' }],
  },
  {
    id: 'item-2',
    boardId: 'room',
    column: 'try',
    text: '次にやること',
    position: 1000,
    authorId: 'user-b',
    authorNickname: 'B',
    status: 'pending',
    assigneeId: 'user-a',
    assigneeNickname: 'A',
    dueDate: '2026-10-31',
  },
];

describe('createBoardFile / parseBoardFile', () => {
  it('書き出したファイルを読み戻せること', () => {
    const file = createBoardFile('振り返り', ITEMS, new Date('2026-10-11T00:00:00.000Z'));
    const parsed = parseBoardFile(serializeBoardFile(file));

    expect(parsed).toEqual(file);
    expect(parsed.board.name).toBe('振り返り');
    expect(parsed.items[0].voters).toEqual([{ userId: 'user-b', nickname: 'B' }]);
    expect(parsed.items[1]).toMatchObject({ status: 'pending', assigneeId: 'user-a', dueDate: '2026-10-31' });
  });

  it('JSONでない場合はエラーになること', () => {
    expect(() => parseBoardFile('not json')).toThrow(InvalidBoardFileError);
  });

  it('形式が異なる場合はエラーになること', () => {
    const file = { ...createBoardFile('振り返り', ITEMS), format: 'other-app' };
    expect(() => parseBoardFile(JSON.stringify(file))).toThrow(InvalidBoardFileError);
  });

  it('バージョンが異なる場合はエラーになること', () => {
    const file = { ...createBoardFile('振り返り', ITEMS), version: 999 };
    expect(() => parseBoardFile(JSON.stringify(file))).toThrow(InvalidBoardFileError);
  });

  it('不正なカラムを含む場合はエラーになること', () => {
    const file = createBoardFile('振り返り', ITEMS);
    const invalid = { ...file, items: [{ ...file.items[0], column: 'unknown' }] };
    expect(() => parseBoardFile(JSON.stringify(invalid))).toThrow(InvalidBoardFileError);
  });

  it('テキストが最大文字数を超える場合はエラーになること', () => {
    const file = createBoardFile('振り返り', ITEMS);
    const invalid = { ...file, items: [{ ...file.items[0], text: 'a'.repeat(1000) }] };
    expect(() => parseBoardFile(JSON.stringify(invalid))).toThrow(InvalidBoardFileError);
  });

  it('アイテム数が上限を超える場合はエラーになること', () => {
    const file = createBoardFile('振り返り', ITEMS);
    const invalid = { ...file, items: Array.from({ length: MAX_ITEMS_PER_BOARD + 1 }, () => file.items[0]) };
    expect(() => parseBoardFile(JSON.stringify(invalid))).toThrow(InvalidBoardFileError);
  });

  it('ボード名が空の場合はエラーになること', () => {
    const file = { ...createBoardFile('振り返り', ITEMS), board: { name: '  ' } };
    expect(() => parseBoardFile(JSON.stringify(file))).toThrow(InvalidBoardFileError);
  });

  it('省略可能な項目が欠けていても読み込めること', () => {
    const file = {
      format: 'simple-kpt-board',
      version: 1,
      exportedAt: '2026-10-11T00:00:00.000Z',
      board: { name: '振り返り' },
      items: [{ column: 'problem', text: '困ったこと', position: 1000 }],
    };

    const [item] = parseBoardFile(JSON.stringify(file)).items;
    expect(item).toMatchObject({ authorId: null, status: null, voters: [] });
  });
});

describe('listFileParticipants', () => {
  it('作成者・担当者・投票者を重複なく一覧にすること', () => {
    const { items } = createBoardFile('振り返り', ITEMS);
    expect(listFileParticipants(items)).toEqual([
      { userId: 'user-a', nickname: 'A' },
      { userId: 'user-b', nickname: 'B' },
    ]);
  });

  it('ユーザーIDのないカードは一覧に含めないこと', () => {
    const items = parseBoardFile(
      JSON.stringify({
        format: 'simple-kpt-board',
        version: 1,
        exportedAt: '2026-10-11T00:00:00.000Z',
        board: { name: '振り返り' },
        items: [{ column: 'keep', text: '作成者なし', position: 1000 }],
      })
    ).items;
    expect(listFileParticipants(items)).toEqual([]);
  });
});

describe('reassignParticipant', () => {
  it('指定した人の作成者・担当者・投票を別のユーザーIDに付け替えること', () => {
    const { items } = createBoardFile('振り返り', ITEMS);
    const reassigned = reassignParticipant(items, 'user-a', 'new-device-user');

    expect(reassigned[0].authorId).toBe('new-device-user');
    expect(reassigned[0].voters).toEqual([{ userId: 'user-b', nickname: 'B' }]);
    expect(reassigned[1].authorId).toBe('user-b');
    expect(reassigned[1].assigneeId).toBe('new-device-user');
  });

  it('投票者も付け替えること', () => {
    const { items } = createBoardFile('振り返り', ITEMS);
    const reassigned = reassignParticipant(items, 'user-b', 'new-device-user');

    expect(reassigned[0].voters).toEqual([{ userId: 'new-device-user', nickname: 'B' }]);
    expect(reassigned[1].authorId).toBe('new-device-user');
  });
});
