import { CalendarDays, Clock, User, X } from 'lucide-react';
import { ReactElement, useEffect } from 'react';

import { CategoryBadge } from '@/components/CategoryBadge';
import { cn } from '@/lib/utils';

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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (item) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [item, onClose]);

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
          <CategoryBadge type={item.column} />
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
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed wrap-break-word whitespace-pre-wrap">{item.text}</p>
            </div>
          </section>

          {/* メタ情報セクション */}
          <section className="border-t border-border/50 px-6 py-6">
            <dl className="grid grid-cols-[1rem_5rem_1fr] gap-x-3 gap-y-3 items-center">
              {/* 作成者情報 */}
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-xs font-medium text-muted-foreground">作成者</dt>
              <dd className="text-sm">{item.authorNickname || '匿名ユーザー'}</dd>

              {/* 作成日時 */}
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-xs font-medium text-muted-foreground">作成日時</dt>
              <dd className="text-sm">{formatDate(item.createdAt)}</dd>

              {/* 更新日時 */}
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <dt className="text-xs font-medium text-muted-foreground">更新日時</dt>
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
