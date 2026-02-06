import { Download, Pencil, Settings, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';

import { BoardDeleteDialog } from '@/components/board/BoardDeleteDialog';
import { BoardMembersDialog } from '@/components/board/BoardMembersDialog';
import { BoardRenameDialog } from '@/components/board/BoardRenameDialog';
import { BoardShareDialog } from '@/components/board/BoardShareDialog';
import { ExportDialog } from '@/components/board/ExportDialog';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { Button } from '@/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { useDeleteBoard } from '@/hooks/useDeleteBoard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { updateBoard } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBoardStore } from '@/stores/useBoardStore';

import type { ReactElement } from 'react';

interface LocationState {
  justCreated?: boolean;
}

export function KPTBoardActions(): ReactElement {
  const { t } = useTranslation('board');
  const navigate = useNavigate();
  const location = useLocation();
  const { boardId } = useParams<{ boardId: string }>();
  const { handleError } = useErrorHandler();

  const user = useAuthStore((state) => state.user);
  const board = useBoardStore((state) => state.currentBoard);
  const items = useBoardStore((state) => state.items);
  const isLoading = useBoardStore((state) => state.isLoading);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // 新規作成後の共有ダイアログ表示
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.justCreated && board) {
      setShareDialogOpen(true);

      // stateをクリアしてリロード時に再表示されないようにする
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [board, location, navigate]);

  const { handleDeleteBoard, deletingBoardId } = useDeleteBoard({
    onSuccess: () => {
      navigate('/boards', { replace: true });
    },
  });

  const handleRenameBoard = useCallback(
    async (newName: string) => {
      if (!boardId) return;
      try {
        setIsRenaming(true);
        const updatedBoard = await updateBoard(boardId, newName);
        useBoardStore.setState({ currentBoard: updatedBoard });
        setRenameDialogOpen(false);
      } catch (error) {
        handleError(error, t('ボード名の変更に失敗しました'));
      } finally {
        setIsRenaming(false);
      }
    },
    [boardId, handleError, t]
  );

  const isOwner = user?.id && (!board || user.id === board.ownerId);

  return (
    <>
      <HeaderActions>
        <BoardMembersDialog boardId={boardId ?? ''} disabled={isLoading} />
        <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)} disabled={isLoading || !board}>
          <Download className="h-4 w-4" />
          {t('エクスポート')}
        </Button>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-muted" aria-label={t('ボード設定')} disabled={isLoading || !board}>
                <Settings className="h-4 w-4" />
                {t('ボード設定')}
              </Button>
            </DropdownMenuTrigger>
            {!isLoading && board && (
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  {t('ボード名を変更')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  {t('ボードを削除')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        )}
      </HeaderActions>

      {/* ボード削除確認ダイアログ */}
      {board && (
        <BoardDeleteDialog
          boardName={board.name}
          isDeleting={deletingBoardId !== null}
          onDelete={() => {
            if (boardId) handleDeleteBoard(boardId);
          }}
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}

      {/* ボード名変更ダイアログ */}
      {board && (
        <BoardRenameDialog
          boardName={board.name}
          isUpdating={isRenaming}
          onRename={handleRenameBoard}
          isOpen={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}

      {/* エクスポートダイアログ */}
      {board && <ExportDialog boardName={board.name} items={items} isOpen={exportDialogOpen} onOpenChange={setExportDialogOpen} />}

      {/* 共有ダイアログ */}
      {board && <BoardShareDialog boardId={board.id} isOpen={shareDialogOpen} onOpenChange={setShareDialogOpen} />}
    </>
  );
}
