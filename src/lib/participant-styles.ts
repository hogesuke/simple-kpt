/**
 * 参加者アイコンの背景色（白文字とのコントラスト比4.5以上を満たす色）
 */
const PARTICIPANT_COLOR_CLASSES = [
  'bg-emerald-700',
  'bg-sky-700',
  'bg-violet-700',
  'bg-amber-700',
  'bg-rose-700',
  'bg-teal-700',
  'bg-indigo-700',
  'bg-orange-700',
] as const;

/**
 * ユーザーIDから参加者アイコンの背景色を決める（同じユーザーには常に同じ色を割り当てる）
 */
export function getParticipantColorClass(userId: string): string {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PARTICIPANT_COLOR_CLASSES[hash % PARTICIPANT_COLOR_CLASSES.length];
}

/**
 * ニックネームの頭文字を取得する（サロゲートペアの文字も1文字として扱う）
 */
export function getNicknameInitial(nickname: string | null): string {
  return Array.from(nickname?.trim() ?? '')[0] ?? '?';
}
