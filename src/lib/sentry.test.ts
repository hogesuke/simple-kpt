import { describe, expect, it } from 'vitest';

import { filterUUIDsFromUrl } from './sentry';

const BOARD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ITEM_ID = '11111111-2222-3333-4444-555555555555';

describe('filterUUIDsFromUrl', () => {
  it('ボードページのURLからboardIdを置換すること', () => {
    expect(filterUUIDsFromUrl(`https://simple-kpt.com/boards/${BOARD_ID}`)).toBe('https://simple-kpt.com/boards/[Filtered]');
  });

  it('itemIdクエリパラメータ付きのボードページURLからUUIDを置換すること', () => {
    expect(filterUUIDsFromUrl(`https://simple-kpt.com/boards/${BOARD_ID}?itemId=${ITEM_ID}`)).toBe(
      'https://simple-kpt.com/boards/[Filtered]?itemId=[Filtered]'
    );
  });

  it('Supabase Edge FunctionのURLからUUIDを置換すること', () => {
    expect(filterUUIDsFromUrl(`https://xxx.supabase.co/functions/v1/get-board?boardId=${BOARD_ID}`)).toBe(
      'https://xxx.supabase.co/functions/v1/get-board?boardId=[Filtered]'
    );
  });

  it('UUIDを含まないページURLはそのまま返すこと', () => {
    expect(filterUUIDsFromUrl('https://simple-kpt.com/boards')).toBe('https://simple-kpt.com/boards');
    expect(filterUUIDsFromUrl('https://simple-kpt.com/login')).toBe('https://simple-kpt.com/login');
  });

  it('空文字列はそのまま返すこと', () => {
    expect(filterUUIDsFromUrl('')).toBe('');
  });
});
