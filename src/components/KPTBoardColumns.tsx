import { useParams } from 'react-router';

import { BoardColumn } from '@/components/BoardColumn';
import { KPTColumnSkeleton } from '@/components/KPTColumnSkeleton';
import { useItemActions } from '@/hooks/useItemActions';
import { useBoardStore } from '@/stores/useBoardStore';

import type { KptItem } from '@/types/kpt';
import type { ReactElement } from 'react';

interface ItemsByColumn {
  keep: KptItem[];
  problem: KptItem[];
  try: KptItem[];
}

interface KPTBoardColumnsProps {
  itemsByColumn: ItemsByColumn;
  onCardClick: (item: KptItem) => void;
}

export function KPTBoardColumns({ itemsByColumn, onCardClick }: KPTBoardColumnsProps): ReactElement {
  const { boardId } = useParams<{ boardId: string }>();

  const isLoading = useBoardStore((state) => state.isLoading);
  const selectedItemId = useBoardStore((state) => state.selectedItem?.id);

  const { handleDeleteItem, handleTagClick, handleMemberClick, handleVote } = useItemActions(boardId);

  if (isLoading) {
    return (
      <>
        <KPTColumnSkeleton />
        <KPTColumnSkeleton />
        <KPTColumnSkeleton />
      </>
    );
  }

  return (
    <>
      <BoardColumn
        column="keep"
        items={itemsByColumn.keep}
        selectedItemId={selectedItemId}
        onDeleteItem={handleDeleteItem}
        onCardClick={onCardClick}
        onTagClick={handleTagClick}
        onMemberClick={handleMemberClick}
        onVote={handleVote}
      />
      <BoardColumn
        column="problem"
        items={itemsByColumn.problem}
        selectedItemId={selectedItemId}
        onDeleteItem={handleDeleteItem}
        onCardClick={onCardClick}
        onTagClick={handleTagClick}
        onMemberClick={handleMemberClick}
        onVote={handleVote}
      />
      <BoardColumn
        column="try"
        items={itemsByColumn.try}
        selectedItemId={selectedItemId}
        onDeleteItem={handleDeleteItem}
        onCardClick={onCardClick}
        onTagClick={handleTagClick}
        onMemberClick={handleMemberClick}
        onVote={handleVote}
      />
    </>
  );
}
