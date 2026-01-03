import { CalendarDays, Clock, Edit2, User, X } from 'lucide-react';
import { ReactElement, useEffect, useRef, useState } from 'react';

import { columnDotColors, columnLabels } from '@/lib/column-styles';
import { cn } from '@/lib/utils';
import { useBoardStore } from '@/stores/useBoardStore';

import type { KptItem } from '@/types/kpt';

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
  const updateItem = useBoardStore((state) => state.updateItem);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detail表示が別itemに変更されたら編集モードを解除
  useEffect(() => {
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

  const handleSaveEdit = async () => {
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
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isEditing && e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (item) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [item, onClose, isEditing]);

  if (!item) {
    return null;
  }

  return (
    <>
      {/* オーバーレイ */}
      <div className="animate-in fade-in fixed inset-0 z-30 bg-black/50 duration-300" onClick={onClose} aria-hidden="true" />

      {/* 右パネル */}
      <div
        id={`detail-panel-${item.id}`}
        role="dialog"
        aria-label="カード詳細"
        aria-modal="true"
        className={cn(
          'fixed top-0 right-0 z-40 h-screen w-full border-l bg-white shadow-2xl',
          'sm:w-96',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className={`h-2 w-2 rounded-full ${columnDotColors[item.column]}`} aria-hidden="true" />
            {columnLabels[item.column]}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {/* カード内容セクション */}
          <section className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-muted-foreground text-sm font-medium">内容</h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-muted-foreground hover:bg-muted inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                  編集
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  ref={textareaRef}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      if (!isSaving && editingText.trim() && editingText !== item?.text) {
                        handleSaveEdit();
                      }
                    }
                  }}
                  className={cn(
                    'border-input bg-background w-full rounded-md border px-3 py-2',
                    'resize-none text-base leading-relaxed',
                    'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                  rows={6}
                  disabled={isSaving}
                  placeholder="テキストを入力してください"
                />
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
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editingText.trim()}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium',
                      'bg-primary text-primary-foreground rounded-md',
                      'hover:bg-primary/90 transition-colors',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed wrap-break-word whitespace-pre-wrap">{item.text}</p>
              </div>
            )}
          </section>

          {/* メタ情報セクション */}
          <section className="border-border/50 border-t px-6 py-6">
            <dl className="grid grid-cols-[1rem_5rem_1fr] items-center gap-x-3 gap-y-3">
              {/* 作成者情報 */}
              <User className="text-muted-foreground h-4 w-4" aria-hidden="true" />
              <dt className="text-muted-foreground text-xs font-medium">作成者</dt>
              <dd className="text-sm">{item.authorNickname || '匿名ユーザー'}</dd>

              {/* 作成日時 */}
              <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden="true" />
              <dt className="text-muted-foreground text-xs font-medium">作成日時</dt>
              <dd className="text-sm">{formatDate(item.createdAt)}</dd>

              {/* 更新日時 */}
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <>
                  <Clock className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  <dt className="text-muted-foreground text-xs font-medium">更新日時</dt>
                  <dd className="text-sm">{formatDate(item.updatedAt)}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
