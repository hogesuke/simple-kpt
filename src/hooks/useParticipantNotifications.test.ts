import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';

import { INITIAL_GRACE_MS, LEAVE_NOTIFICATION_DELAY_MS, useParticipantNotifications } from './useParticipantNotifications';

import type { BoardMember } from '@/types/kpt';

const mockToast = vi.fn();
vi.mock('sonner', () => ({
  toast: (message: string) => mockToast(message),
}));

const member = (userId: string, nickname: string): BoardMember => ({ id: userId, userId, nickname, role: 'member', createdAt: '' });

const ME = member('me', '自分');
const SATO = member('sato', '佐藤');
const SUZUKI = member('suzuki', '鈴木');

function setup(initialMembers: BoardMember[]) {
  return renderHook(({ members }) => useParticipantNotifications(members, ME.userId), {
    initialProps: { members: initialMembers },
  });
}

describe('useParticipantNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('参加直後に表示される既存の参加者は通知しないこと', () => {
    const { rerender } = setup([ME]);
    rerender({ members: [ME, SATO] });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('猶予時間の経過後に参加した人を通知すること', () => {
    const { rerender } = setup([ME]);
    vi.advanceTimersByTime(INITIAL_GRACE_MS);
    rerender({ members: [ME, SATO] });

    expect(mockToast).toHaveBeenCalledWith(i18n.t('room:{{name}}さんが参加しました', { name: '佐藤' }));
  });

  it('自分自身は通知しないこと', () => {
    const { rerender } = setup([]);
    vi.advanceTimersByTime(INITIAL_GRACE_MS);
    rerender({ members: [ME] });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('退出した人を遅れて通知すること', () => {
    const { rerender } = setup([ME, SATO]);
    rerender({ members: [ME] });

    expect(mockToast).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(LEAVE_NOTIFICATION_DELAY_MS);
    });
    expect(mockToast).toHaveBeenCalledWith(i18n.t('room:{{name}}さんが退出しました', { name: '佐藤' }));
  });

  it('退出の通知前に戻ってきた場合は参加も退出も通知しないこと', () => {
    const { rerender } = setup([ME, SATO]);
    vi.advanceTimersByTime(INITIAL_GRACE_MS);
    rerender({ members: [ME] });
    vi.advanceTimersByTime(LEAVE_NOTIFICATION_DELAY_MS - 1000);
    rerender({ members: [ME, SATO] });
    act(() => {
      vi.advanceTimersByTime(LEAVE_NOTIFICATION_DELAY_MS);
    });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('複数人の参加と退出をそれぞれ通知すること', () => {
    const { rerender } = setup([ME, SATO]);
    vi.advanceTimersByTime(INITIAL_GRACE_MS);
    rerender({ members: [ME, SUZUKI] });
    act(() => {
      vi.advanceTimersByTime(LEAVE_NOTIFICATION_DELAY_MS);
    });

    expect(mockToast).toHaveBeenCalledWith(i18n.t('room:{{name}}さんが参加しました', { name: '鈴木' }));
    expect(mockToast).toHaveBeenCalledWith(i18n.t('room:{{name}}さんが退出しました', { name: '佐藤' }));
  });

  it('アンマウント時に退出の通知を取り消すこと', () => {
    const { rerender, unmount } = setup([ME, SATO]);
    rerender({ members: [ME] });
    unmount();
    vi.advanceTimersByTime(LEAVE_NOTIFICATION_DELAY_MS);

    expect(mockToast).not.toHaveBeenCalled();
  });
});
