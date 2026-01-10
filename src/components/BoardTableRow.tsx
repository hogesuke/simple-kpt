import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ReactElement, useState } from 'react';

import { BoardDeleteDialog } from '@/components/BoardDeleteDialog';
import { BoardRenameDialog } from '@/components/BoardRenameDialog';
import { Button } from '@/components/ui/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/shadcn/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/shadcn/table';

import type { KptBoard } from '@/types/kpt';

interface BoardTableRowProps {
  board: KptBoard;
  isOwner: boolean;
  isDeleting: boolean;
  isRenaming: boolean;
  onDelete: () => void;
  onRename: (newName: string) => void | Promise<void>;
  onClick: () => void;
}

/**
 * ボードリストテーブルの行
 */
export function BoardTableRow({ board, isOwner, isDeleting, isRenaming, onDelete, onRename, onClick }: BoardTableRowProps): ReactElement {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleRename = async (newName: string) => {
    await onRename(newName);
    setRenameDialogOpen(false);
  };

  const formattedDate = new Date(board.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onClick}>
        <TableCell className="font-medium">{board.name}</TableCell>
        <TableCell className="text-muted-foreground">{isOwner ? 'オーナー' : 'メンバー'}</TableCell>
        <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
        <TableCell className="w-12">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="hover:bg-muted h-8 w-8" aria-label="ボード操作メニュー">
                  <MoreHorizontal className="text-muted-foreground h-4 w-4" />
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
                  ボード名を変更
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  削除
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
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <BoardRenameDialog
        boardName={board.name}
        isUpdating={isRenaming}
        onRename={handleRename}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />
    </>
  );
}
