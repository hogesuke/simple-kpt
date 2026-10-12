import { describe, expect, it } from 'vitest';

import { sanitizeUrl } from './url-sanitizer';

describe('sanitizeUrl', () => {
  it('ルームURLからルームIDと鍵を取り除くこと', () => {
    expect(sanitizeUrl('https://simple-kpt.com/r/UD8OxXlE5-AEKQl5Kd78rw#hfTWDJDl9lzTKb45O5uIwA')).toBe(
      'https://simple-kpt.com/r/[Filtered]'
    );
  });

  it('パスのみのルームURLからルームIDを取り除くこと', () => {
    expect(sanitizeUrl('/r/UD8OxXlE5-AEKQl5Kd78rw')).toBe('/r/[Filtered]');
  });

  it('クエリ文字列を削除すること', () => {
    expect(sanitizeUrl('https://simple-kpt.com/demo?itemId=demo-keep-1')).toBe('https://simple-kpt.com/demo');
  });

  it('UUIDを置換すること', () => {
    expect(sanitizeUrl('https://simple-kpt.com/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'https://simple-kpt.com/items/[Filtered]'
    );
  });

  it('識別情報を含まないURLはそのまま返すこと', () => {
    expect(sanitizeUrl('https://simple-kpt.com/new')).toBe('https://simple-kpt.com/new');
    expect(sanitizeUrl('/')).toBe('/');
  });

  it('空文字列はそのまま返すこと', () => {
    expect(sanitizeUrl('')).toBe('');
  });
});
