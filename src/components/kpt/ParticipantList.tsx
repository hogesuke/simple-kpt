import { Check, Pencil, X } from 'lucide-react';
import { FormEvent, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { useBoardContext } from '@/contexts/BoardContext';
import { cn } from '@/lib/cn';
import { normalizeNickname } from '@/lib/p2p/identity';
import { getNicknameInitial, getParticipantColorClass } from '@/lib/participant-styles';
import { NICKNAME_MAX_LENGTH } from '@shared/constants';

import type { BoardMember } from '@/types/kpt';

/** ヘッダーに並べるアイコンの最大数（超えた分は「+N」にまとめる） */
const MAX_VISIBLE_AVATARS = 4;

interface ParticipantAvatarProps {
  member: BoardMember;
  className?: string;
}

function ParticipantAvatar({ member, className }: ParticipantAvatarProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-7 flex-none items-center justify-center rounded-full text-[12.5px] font-bold text-white',
        getParticipantColorClass(member.userId),
        className
      )}
    >
      {getNicknameInitial(member.nickname)}
    </span>
  );
}

/**
 * ボードの参加者一覧
 *
 * ヘッダーには参加者のアイコンを重ねて表示し、クリックすると一覧を開く。
 * 一覧の参加者をクリックすると、その参加者のカードに絞り込む。
 */
export function ParticipantList(): ReactElement {
  const { t } = useTranslation('room');
  const { members, currentUserId, setFilterMemberId, changeNickname } = useBoardContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setIsEditingNickname(false);
  };

  // 自分を先頭に表示する
  const sortedMembers = [...members].sort((a, b) => Number(b.userId === currentUserId) - Number(a.userId === currentUserId));
  const visibleMembers = sortedMembers.slice(0, MAX_VISIBLE_AVATARS);
  const hiddenCount = sortedMembers.length - visibleMembers.length;

  const handleSelect = (userId: string) => {
    setFilterMemberId(userId);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex items-center rounded-full py-1 pr-2 pl-1 transition-colors"
          aria-label={t('参加者一覧を開く（{{count}}人が参加中）', { count: members.length })}
        >
          <span className="flex -space-x-2">
            {visibleMembers.map((member) => (
              <ParticipantAvatar key={member.userId} member={member} className="ring-background ring-2" />
            ))}
          </span>
          {hiddenCount > 0 && <span className="text-muted-foreground ml-1.5 text-xs font-bold">+{hiddenCount}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <p className="border-border-subtle border-b px-4 py-3 text-[13.5px] font-bold">
          {t('参加者（{{count}}人）', { count: members.length })}
        </p>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {sortedMembers.map((member) =>
            member.userId === currentUserId && isEditingNickname && changeNickname ? (
              <li key={member.userId}>
                <NicknameEditor
                  member={member}
                  onSave={(nickname) => {
                    changeNickname(nickname);
                    setIsEditingNickname(false);
                  }}
                  onCancel={() => setIsEditingNickname(false)}
                />
              </li>
            ) : (
              <li key={member.userId} className="flex items-center">
                <button
                  type="button"
                  className="hover:bg-accent flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
                  onClick={() => handleSelect(member.userId)}
                  title={t('{{name}}さんのカードに絞り込む', { name: member.nickname })}
                >
                  <ParticipantAvatar member={member} />
                  <span className="flex min-w-0 items-baseline">
                    <span className="truncate">{member.nickname}</span>
                    {member.userId === currentUserId && <span className="text-muted-foreground flex-none text-xs">{t('（あなた）')}</span>}
                  </span>
                </button>
                {member.userId === currentUserId && changeNickname && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 flex-none p-0"
                    onClick={() => setIsEditingNickname(true)}
                    aria-label={t('ニックネームを変更')}
                    title={t('ニックネームを変更')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </li>
            )
          )}
        </ul>
        <p className="text-muted-foreground-subtle border-border-subtle border-t px-4 py-2.5 text-xs">
          {t('名前をクリックすると、その人のカードに絞り込みます')}
        </p>
      </PopoverContent>
    </Popover>
  );
}

interface NicknameEditorProps {
  member: BoardMember;
  onSave: (nickname: string) => void;
  onCancel: () => void;
}

/**
 * 参加者一覧の中で、自分のニックネームを変更するフォーム
 */
function NicknameEditor({ member, onSave, onCancel }: NicknameEditorProps): ReactElement {
  const { t } = useTranslation('room');
  const [value, setValue] = useState(member.nickname ?? '');
  const normalized = normalizeNickname(value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalized) return;
    if (normalized === member.nickname) {
      onCancel();
      return;
    }
    onSave(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 px-2.5 py-1.5">
      <ParticipantAvatar member={member} />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Escapeキーでは一覧を閉じずに、編集だけを取り消す
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel();
          }
        }}
        maxLength={NICKNAME_MAX_LENGTH}
        aria-label={t('ニックネーム')}
        className="h-8 min-w-0 flex-1 px-2.5"
        // 編集を始めたらすぐに入力できるようにする
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
      <Button type="submit" size="sm" className="h-8 w-8 flex-none p-0" disabled={!normalized} aria-label={t('保存')}>
        <Check className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 flex-none p-0" onClick={onCancel} aria-label={t('キャンセル')}>
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}
