import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { BoardDeleteDialog } from '@/components/board/BoardDeleteDialog';
import { BoardRenameDialog } from '@/components/board/BoardRenameDialog';
import { Button } from '@/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { rolePill } from '@/lib/role-styles';

import type { KptBoard } from '@/types/kpt';

interface BoardTableRowProps {
  board: KptBoard;
  isOwner: boolean;
  isDeleting: boolean;
  isRenaming: boolean;
  onDelete: () => void;
  onRename: (newName: string) => void | Promise<void>;
}

/**
 * ボードリストテーブルの行
 */
export function BoardTableRow({ board, isOwner, isDeleting, isRenaming, onDelete, onRename }: BoardTableRowProps): ReactElement {
  const { t, i18n } = useTranslation('board');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleRename = async (newName: string) => {
    await onRename(newName);
    setRenameDialogOpen(false);
  };

  const formattedDate = new Date(board.createdAt).toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <>
      <TableRow>
        <TableCell>
          <Link to={`/boards/${board.id}`} className="flex h-full items-center rounded text-[15px] font-bold hover:underline">
            {board.name}
          </Link>
        </TableCell>
        <TableCell>
          {/* ロールは淡い青のピルで表示する */}
          <span className={rolePill}>{isOwner ? t('オーナー') : t('メンバー')}</span>
        </TableCell>
        <TableCell className="text-muted-foreground-subtle text-[13.5px]">{formattedDate}</TableCell>
        <TableCell className="w-[68px] pr-5 pl-0">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-icon hover:text-foreground h-8 w-8 hover:bg-transparent"
                  aria-label={t('ボード操作メニュー')}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t('ボード名を変更')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('ボードを削除')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>

      <BoardDeleteDialog
        boardName={board.name}
        isDeleting={isDeleting}
        onDelete={onDelete}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <BoardRenameDialog
        boardName={board.name}
        isUpdating={isRenaming}
        onRename={handleRename}
        isOpen={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />
    </>
  );
}
