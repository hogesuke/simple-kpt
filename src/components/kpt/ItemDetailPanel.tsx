import * as FocusScope from '@radix-ui/react-focus-scope';
import { format } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { CalendarIcon, Edit2, Loader2, X } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CharacterCounter } from '@/components/forms/CharacterCounter';
import { Button } from '@/components/shadcn/button';
import { Calendar } from '@/components/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { useBoardContext } from '@/contexts/BoardContext';
import { cn } from '@/lib/cn';
import { columnDot } from '@/lib/column-styles';
import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

import { TextWithHashtags } from './KPTCard';
import { VoteButton } from './VoteButton';

import type { KptItem, TryStatus } from '@/types/kpt';

export interface ItemDetailPanelProps {
  item: KptItem | null;
  onClose: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '---';

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function ItemDetailPanel({ item, onClose }: ItemDetailPanelProps): ReactElement | null {
  const { t, i18n } = useTranslation('board');
  const { updateItem, setFilterTag, members, toggleVote } = useBoardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // 言語に応じたdate-fnsのlocaleを取得
  const dateLocale = useMemo(() => (i18n.language === 'ja' ? ja : enUS), [i18n.language]);

  const statusOptions: { value: TryStatus; label: string }[] = useMemo(
    () => [
      { value: 'wont_fix', label: t('対応不要') },
      { value: 'pending', label: t('未対応') },
      { value: 'in_progress', label: t('対応中') },
      { value: 'done', label: t('完了') },
    ],
    [t]
  );

  const columnLabels = {
    keep: 'Keep',
    problem: 'Problem',
    try: 'Try',
  };

  // Detail表示が別itemに変更されたら編集モードを解除
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 表示対象itemの切り替えに伴う編集状態のリセットのため必要
    setIsEditing(false);
    setEditingText('');
  }, [item?.id]);

  // 編集モードになったときにフォーカスを設定
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // カーソルを末尾に移動
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!item) return;
    setEditingText(item.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingText('');
  };

  const handleTagClick = useCallback(
    (tag: string) => {
      setFilterTag(tag);
      onClose();
    },
    [setFilterTag, onClose]
  );

  const handleStatusChange = useCallback(
    async (status: TryStatus) => {
      if (!item) return;

      // 対応不要の場合は担当者と期日をクリア
      if (status === 'wont_fix') {
        await updateItem({ ...item, status, assigneeId: null, dueDate: null });
      } else {
        await updateItem({ ...item, status });
      }
    },
    [item, updateItem]
  );

  const handleAssigneeChange = useCallback(
    async (assigneeId: string) => {
      if (!item) return;
      const newAssigneeId = assigneeId === 'unassigned' ? null : assigneeId;
      const newAssigneeNickname = newAssigneeId ? (members.find((m) => m.userId === newAssigneeId)?.nickname ?? null) : null;
      await updateItem({ ...item, assigneeId: newAssigneeId, assigneeNickname: newAssigneeNickname });
    },
    [item, members, updateItem]
  );

  const handleDueDateChange = useCallback(
    async (date: Date | undefined) => {
      if (!item) return;
      const dueDate = date ? format(date, 'yyyy-MM-dd') : null;
      await updateItem({ ...item, dueDate });
      setDueDateOpen(false);
    },
    [item, updateItem]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!item) return;

    // 空文字または変更がない場合は保存しない
    if (!editingText.trim() || editingText === item.text) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await updateItem({
        ...item,
        text: editingText.trim(),
      });
      setIsEditing(false);
      setEditingText('');
    } finally {
      setIsSaving(false);
    }
  }, [item, editingText, updateItem]);

  useEffect(() => {
    if (!item) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (isEditing && e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [item, onClose, isEditing]);

  if (!item) {
    return null;
  }

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="animate-in fade-in fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] duration-300 dark:bg-white/15"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 右パネル */}
      <FocusScope.Root trapped loop asChild>
        <div
          id={`detail-panel-${item.id}`}
          role="dialog"
          aria-label={t('カード詳細')}
          aria-modal="true"
          className={cn(
            'border-border-subtle bg-card shadow-modal fixed top-0 right-0 z-40 h-screen w-full border-l',
            'sm:w-md',
            'flex flex-col',
            'animate-in slide-in-from-right duration-300'
          )}
        >
          {/* ヘッダー */}
          <div className="border-border-subtle flex items-center justify-between border-b px-6 py-[22px]">
            <span className="inline-flex items-center gap-2.5 text-lg font-black">
              <span className={columnDot({ column: item.column, size: 'lg' })} aria-hidden="true" />
              {columnLabels[item.column]}
            </span>
            {/* 閉じる×ボタンは全モーダル／サイドペインで同一スタイル */}
            <button
              type="button"
              onClick={onClose}
              className="text-icon hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent transition-colors"
              aria-label={t('詳細パネルを閉じる')}
            >
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto">
            {/* カード内容 */}
            <section className="px-6 py-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-muted-foreground text-[13px] font-bold">{t('内容')}</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-primary hover:text-primary-dark inline-flex shrink-0 items-center gap-1.5 rounded text-[13px] font-bold transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('編集')}
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="relative">
                    <CharacterCounter current={editingText.length} max={ITEM_TEXT_MAX_LENGTH} className="absolute -top-7 right-0" />
                    <textarea
                      ref={textareaRef}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      aria-invalid={editingText.length > ITEM_TEXT_MAX_LENGTH}
                      aria-describedby={editingText.length > ITEM_TEXT_MAX_LENGTH ? 'edit-text-error' : undefined}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          const isOverLimit = editingText.length > ITEM_TEXT_MAX_LENGTH;
                          if (!isSaving && !isOverLimit) {
                            handleSaveEdit();
                          }
                        }
                      }}
                      className={cn(
                        'border-input bg-card w-full rounded-md border px-3 py-2',
                        'resize-none text-base leading-relaxed',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                      rows={6}
                      disabled={isSaving}
                      placeholder={t('テキストを入力してください')}
                    />
                    {editingText.length > ITEM_TEXT_MAX_LENGTH && (
                      <span id="edit-text-error" role="alert" className="sr-only">
                        {t('validation:{{max}}文字以内で入力してください', { max: ITEM_TEXT_MAX_LENGTH })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium',
                        'bg-secondary text-secondary-foreground rounded-md',
                        'hover:bg-secondary/80 transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {t('ui:キャンセル')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editingText.trim() || editingText.length > ITEM_TEXT_MAX_LENGTH}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium',
                        'bg-primary text-primary-foreground rounded-md',
                        'hover:bg-primary/90 transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('ui:保存')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                        <TextWithHashtags text={item.text} onTagClick={handleTagClick} />
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <VoteButton
                        voteCount={item.voteCount ?? 0}
                        hasVoted={item.hasVoted ?? false}
                        voters={item.voters ?? []}
                        onVote={() => toggleVote(item.id)}
                        size="md"
                        totalMemberCount={members.length}
                        className={item.hasVoted ? 'mr-3' : ''}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Try専用フィールド */}
            {item.column === 'try' && (
              <section className="border-border-subtle border-t px-6 py-6">
                <h3 className="text-muted-foreground mb-4 text-[13px] font-bold">{t('対応状況')}</h3>

                {/* ステータス / 担当者 / 期日 は 76px + 1fr のグリッドで揃える */}
                <div className="grid grid-cols-[76px_1fr] items-center gap-x-3.5 gap-y-3">
                  <span className="text-muted-foreground-subtle text-[13px] whitespace-nowrap">{t('ステータス')}</span>
                  <Select value={item.status ?? 'pending'} onValueChange={(v) => handleStatusChange(v as TryStatus)}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground-subtle text-[13px]">{t('担当者')}</span>
                  <Select
                    value={item.assigneeId ?? 'unassigned'}
                    onValueChange={handleAssigneeChange}
                    disabled={item.status === 'wont_fix'}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={t('ui:未設定')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <span className="text-muted-foreground">{t('ui:未設定')}</span>
                      </SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.nickname ?? 'Unknown User'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground-subtle text-[13px]">{t('期日')}</span>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('h-10 w-full justify-start text-left font-normal', !item.dueDate && 'text-muted-foreground')}
                        disabled={item.status === 'wont_fix'}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {item.dueDate ? format(new Date(item.dueDate), 'yyyy/MM/dd') : t('ui:未設定')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={item.dueDate ? new Date(item.dueDate) : undefined}
                        onSelect={handleDueDateChange}
                        locale={dateLocale}
                        // eslint-disable-next-line jsx-a11y/no-autofocus -- ポップオーバーを開いた直後にカレンダーへフォーカスを移すため（react-day-picker v9のinitialFocus相当）
                        autoFocus
                      />
                      {item.dueDate && (
                        <div className="border-t p-2">
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => handleDueDateChange(undefined)}>
                            {t('期日をクリア')}
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </section>
            )}

            {/* メタ情報 */}
            <section className="border-border-subtle border-t px-6 py-6">
              <dl className="grid grid-cols-[72px_1fr] items-center gap-x-3.5 gap-y-3">
                {/* 作成者情報 */}
                <dt className="text-muted-foreground-subtle text-[13px]">{t('作成者')}</dt>
                <dd className="text-[13.5px]">{item.authorNickname || 'Unknown User'}</dd>

                {/* 作成日時 */}
                <dt className="text-muted-foreground-subtle text-[13px]">{t('作成日時')}</dt>
                <dd className="text-[13.5px]">{formatDate(item.createdAt)}</dd>

                {/* 更新日時 */}
                {item.updatedAt && item.updatedAt !== item.createdAt && (
                  <>
                    <dt className="text-muted-foreground-subtle text-[13px]">{t('更新日時')}</dt>
                    <dd className="text-[13.5px]">{formatDate(item.updatedAt)}</dd>
                  </>
                )}
              </dl>
            </section>
          </div>
        </div>
      </FocusScope.Root>
    </>
  );
}
