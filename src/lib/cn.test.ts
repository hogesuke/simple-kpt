import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  describe('clsxの機能', () => {
    it('複数のクラス名を結合すること', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
    });

    it('条件付きクラスを処理すること', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')).toBe('btn btn-active');
    });

    it('オブジェクト構文を処理すること', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('falsy値を無視すること', () => {
      expect(cn('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
    });
  });

  describe('twMergeの機能', () => {
    it('Tailwindクラスの競合を解決すること', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('異なるプロパティのクラスは保持すること', () => {
      expect(cn('px-2', 'py-4', 'text-sm')).toBe('px-2 py-4 text-sm');
    });

    it('レスポンシブ・状態クラスを保持すること', () => {
      expect(cn('bg-white', 'md:bg-gray-100', 'hover:bg-gray-200')).toBe('bg-white md:bg-gray-100 hover:bg-gray-200');
    });
  });

  describe('clsxとtwMergeの組み合わせ', () => {
    it('clsxとtwMergeが組み合わさって動作すること', () => {
      const variant = 'primary';
      expect(cn('px-2 py-1', variant === 'primary' && 'bg-blue-500', { 'text-white': true }, 'px-4')).toBe(
        'py-1 bg-blue-500 text-white px-4'
      );
    });
  });
});
