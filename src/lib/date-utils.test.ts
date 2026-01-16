import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isOverdue } from './date-utils';

describe('isOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('期日がnullの場合、falseを返すこと', () => {
    expect(isOverdue(null, 'pending')).toBe(false);
    expect(isOverdue(null, null)).toBe(false);
  });

  it('期日が過去の場合、trueを返すこと', () => {
    expect(isOverdue('2026-01-15', 'pending')).toBe(true);
    expect(isOverdue('2026-01-10', 'in_progress')).toBe(true);
    expect(isOverdue('2025-12-31', null)).toBe(true);
  });

  it('期日が今日の場合、falseを返すこと', () => {
    expect(isOverdue('2026-01-16', 'pending')).toBe(false);
    expect(isOverdue('2026-01-16', 'in_progress')).toBe(false);
  });

  it('期日が未来の場合、falseを返すこと', () => {
    expect(isOverdue('2026-01-17', 'pending')).toBe(false);
    expect(isOverdue('2026-02-01', 'in_progress')).toBe(false);
  });

  it('ステータスがdoneの場合、期日が過去でもfalseを返すこと', () => {
    expect(isOverdue('2026-01-10', 'done')).toBe(false);
    expect(isOverdue('2025-01-01', 'done')).toBe(false);
  });

  it('ステータスがwont_fixの場合、期日が過去でもfalseを返すこと', () => {
    expect(isOverdue('2026-01-10', 'wont_fix')).toBe(false);
    expect(isOverdue('2025-01-01', 'wont_fix')).toBe(false);
  });

  it('ステータスがnullでも期日が過去ならtrueを返すこと', () => {
    expect(isOverdue('2026-01-15', null)).toBe(true);
  });
});
