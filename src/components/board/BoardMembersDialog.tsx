import { Check, Copy, Users } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetchBoardMembers } from '@/lib/kpt-api';
import { rolePill } from '@/lib/role-styles';

import type { BoardMember } from '@/types/kpt';

interface BoardMembersDialogProps {
  boardId: string;
  disabled?: boolean;
}

export function BoardMembersDialog({ boardId, disabled = false }: BoardMembersDialogProps): ReactElement {
  const { t } = useTranslation('board');
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { handleError } = useErrorHandler();

  const shareUrl = `${window.location.origin}/boards/${boardId}`;

  useEffect(() => {
    if (!isOpen) return;

    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBoardMembers(boardId);
        setMembers(data);
      } catch (error) {
        handleError(error, t('error:メンバー一覧の取得に失敗しました'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [isOpen, boardId, handleError, t]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      handleError(error, t('error:URLのコピーに失敗しました'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Users className="h-4 w-4" />
          {t('参加メンバー')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Users className="text-primary h-5 w-5" />
            {t('参加メンバー')}
          </DialogTitle>
          <DialogDescription className="text-[13.5px]">{t('URLを共有して、ボードにメンバーを招待できます。')}</DialogDescription>
        </DialogHeader>

        {/* 共有URL */}
        <div className="space-y-2">
          <p className="text-[13.5px] font-bold">{t('共有URL')}</p>
          <div className="flex items-center gap-2.5">
            <input
              readOnly
              aria-readonly="true"
              value={shareUrl}
              className="bg-surface-muted border-primary/20 text-primary-dark flex-1 overflow-hidden rounded-[11px] border px-3.5 py-3 text-[13px] text-ellipsis whitespace-nowrap"
              onClick={(e) => e.currentTarget.select()}
              aria-label={t('共有URL（クリックで選択）')}
            />
            <Button
              variant="outline"
              onClick={handleCopyUrl}
              aria-label={copied ? t('コピー済み') : t('URLをコピー')}
              className="h-auto w-[46px] shrink-0 self-stretch rounded-[11px] px-0"
            >
              {copied ? <Check className="h-[17px] w-[17px]" /> : <Copy className="h-[17px] w-[17px]" />}
            </Button>
          </div>
          <p className="text-muted-foreground-subtle text-[12.5px]">{t('このURLを知っている人はボードに参加できます。')}</p>
        </div>

        {/* メンバー一覧 */}
        <div className="space-y-2">
          <p className="mb-2.5 text-sm font-black">
            {t('メンバーs')} {!isLoading && <span className="text-muted-foreground-subtle font-bold">({members.length})</span>}
          </p>
          <div className="max-h-60 overflow-y-auto">
            <Table containerClassName="rounded-[12px] shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-[11px]">{t('ニックネーム')}</TableHead>
                  <TableHead className="w-[120px] px-4 py-[11px]">{t('ロール')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4 py-3.5">
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="px-4 py-3.5 text-sm font-bold">{member.nickname ?? 'Unknown User'}</TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span className={rolePill}>{member.role === 'owner' ? t('オーナー') : t('メンバー')}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
