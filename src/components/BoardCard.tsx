import { MoreHorizontal, Trash2 } from 'lucide-react';
import { ReactElement, useState } from 'react';

import { BoardDeleteDialog } from '@/components/BoardDeleteDialog';
import { Button } from '@/components/ui/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/shadcn/dropdown-menu';

import type { KptBoard } from '@/types/kpt';

interface BoardCardProps {
  board: KptBoard;
  isOwner: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onClick: () => void;
}

/**
 * ボード一覧に表示する個別のボードカード
 */
export function BoardCard({ board, isOwner, isDeleting, onDelete, onClick }: BoardCardProps): ReactElement {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <h3 className="font-semibold">{board.name}</h3>
      </button>

      {isOwner && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted h-8 w-8" aria-label="ボード操作メニュー">
                <MoreHorizontal className="text-muted-foreground h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <BoardDeleteDialog
        boardName={board.name}
        isDeleting={isDeleting}
        onDelete={onDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
