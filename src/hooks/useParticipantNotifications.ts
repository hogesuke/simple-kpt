import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import i18n from '@/i18n';

import type { BoardMember } from '@/types/kpt';

/** 自分の参加直後に、既存の参加者を「参加しました」と通知しないための猶予時間 */
export const INITIAL_GRACE_MS = 5000;
/** 一時的な切断・再接続で退出を通知しないよう、退出の通知を遅らせる時間 */
export const LEAVE_NOTIFICATION_DELAY_MS = 5000;

/**
 * 参加者の参加・退出を通知する
 */
export function useParticipantNotifications(members: BoardMember[], currentUserId: string | null): void {
  const mountedAtRef = useRef<number | null>(null);
  const knownMembersRef = useRef(new Map<string, string>());
  const leaveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    mountedAtRef.current ??= Date.now();
    const isInitialPeriod = Date.now() - mountedAtRef.current < INITIAL_GRACE_MS;
    const known = knownMembersRef.current;
    const leaveTimers = leaveTimersRef.current;
    const currentIds = new Set(members.map((member) => member.userId));

    for (const member of members) {
      if (member.userId === currentUserId || known.has(member.userId)) continue;
      known.set(member.userId, member.nickname ?? '');

      const leaveTimer = leaveTimers.get(member.userId);
      if (leaveTimer) {
        // 退出の通知前に戻ってきた場合は、一時的な切断とみなして通知しない
        clearTimeout(leaveTimer);
        leaveTimers.delete(member.userId);
        continue;
      }

      if (!isInitialPeriod) {
        toast(i18n.t('room:{{name}}さんが参加しました', { name: member.nickname }));
      }
    }

    for (const [userId, nickname] of known) {
      if (currentIds.has(userId)) continue;
      known.delete(userId);
      leaveTimers.set(
        userId,
        setTimeout(() => {
          leaveTimers.delete(userId);
          toast(i18n.t('room:{{name}}さんが退出しました', { name: nickname }));
        }, LEAVE_NOTIFICATION_DELAY_MS)
      );
    }
  }, [members, currentUserId]);

  useEffect(() => {
    const leaveTimers = leaveTimersRef.current;
    return () => {
      leaveTimers.forEach(clearTimeout);
      leaveTimers.clear();
    };
  }, []);
}
