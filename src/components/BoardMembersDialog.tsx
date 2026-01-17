import { Check, Copy, Users } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetchBoardMembers } from '@/lib/kpt-api';

import type { BoardMember } from '@/types/kpt';

interface BoardMembersDialogProps {
  boardId: string;
  disabled?: boolean;
}

export function BoardMembersDialog({ boardId, disabled = false }: BoardMembersDialogProps): ReactElement {
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
        handleError(error, 'メンバー一覧の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [isOpen, boardId, handleError]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      handleError(error, 'URLのコピーに失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Users className="h-4 w-4" />
          参加メンバー
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>参加メンバー</DialogTitle>
          <DialogDescription>URLを共有して、ボードにメンバーを招待できます。</DialogDescription>
        </DialogHeader>

        {/* 共有URL */}
        <div className="space-y-2">
          <p className="text-sm font-medium">共有URL</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="bg-muted flex-1 rounded-md border px-3 py-2 text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button size="sm" variant="outline" onClick={handleCopyUrl} aria-label={copied ? 'コピー済み' : 'URLをコピー'}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">このURLを知っている人はボードに参加できます。</p>
        </div>

        {/* メンバー一覧 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">メンバー ({members.length})</p>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="border-border flex items-center justify-between rounded-md border p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{member.nickname ?? 'Unknown User'}</span>
                    <span className="text-muted-foreground text-xs">{member.role === 'owner' ? 'オーナー' : 'メンバー'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
