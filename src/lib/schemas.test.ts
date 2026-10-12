/* eslint-disable vitest/no-conditional-expect */
import { describe, expect, it } from 'vitest';

import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

import { itemTextSchema } from './schemas';

describe('itemTextSchema', () => {
  it('有効なテキストを受け入れること', () => {
    const result = itemTextSchema.safeParse({ text: 'これはKeepです' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('これはKeepです');
    }
  });

  it('空文字を拒否すること', () => {
    const result = itemTextSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('最大文字数を超える場合に拒否すること', () => {
    const longText = 'あ'.repeat(ITEM_TEXT_MAX_LENGTH + 1);
    const result = itemTextSchema.safeParse({ text: longText });
    expect(result.success).toBe(false);
  });

  it('最大文字数ちょうどは受け入れること', () => {
    const maxText = 'あ'.repeat(ITEM_TEXT_MAX_LENGTH);
    const result = itemTextSchema.safeParse({ text: maxText });
    expect(result.success).toBe(true);
  });

  it('前後の空白がtrimされること', () => {
    const result = itemTextSchema.safeParse({ text: '  テスト  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('テスト');
    }
  });
});
