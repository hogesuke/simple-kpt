import { DndContext, DragOverlay } from '@dnd-kit/core';
import { formatInTimeZone } from 'date-fns-tz';
import { ArrowLeft, Download } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { ExportDialog } from '@/components/board/ExportDialog';
import { BoardColumn } from '@/components/kpt/BoardColumn';
import { FilterBar } from '@/components/kpt/FilterBar';
import { ItemAddForm } from '@/components/kpt/ItemAddForm';
import { ItemDetailPanel } from '@/components/kpt/ItemDetailPanel';
import { KPTCard } from '@/components/kpt/KPTCard';
import { SummaryButton } from '@/components/kpt/SummaryButton';
import { SummaryDialog } from '@/components/kpt/SummaryDialog';
import { Timer } from '@/components/kpt/Timer';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { Button } from '@/components/shadcn/button';
import { DemoBoardProvider } from '@/contexts/DemoBoardProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';
import { generateSummaryDemo } from '@/lib/kpt-api';
import { DEMO_EXPLANATION_ITEM_IDS, DEMO_MEMBERS, useDemoStore } from '@/stores/useDemoStore';

const DEMO_SUMMARY_STORAGE_KEY = 'demo_summary_used_date';

/**
 * 日本時間での本日日付をYYYY-MM-DD形式で取得
 */
function getTodayInJST(): string {
  return formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}

import type { KptColumnType, KptItem } from '@/types/kpt';

const columns: KptColumnType[] = ['keep', 'problem', 'try'];

// デモユーザーID（タイマーの「他の人のカードを隠す」機能用）
const DEMO_USER_ID = 'demo-user-1';

export function DemoBoard(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleError } = useErrorHandler();

  const items = useDemoStore((state) => state.items);
  const selectedItem = useDemoStore((state) => state.selectedItem);
  const filter = useDemoStore((state) => state.filter);
  const timerState = useDemoStore((state) => state.timerState);
  const memberNicknameMap = useDemoStore((state) => state.memberNicknameMap);
  const addItem = useDemoStore((state) => state.addItem);
  const updateItem = useDemoStore((state) => state.updateItem);
  const deleteItem = useDemoStore((state) => state.deleteItem);
  const setSelectedItem = useDemoStore((state) => state.setSelectedItem);
  const setFilterTag = useDemoStore((state) => state.setFilterTag);
  const setFilterMemberId = useDemoStore((state) => state.setFilterMemberId);
  const toggleVote = useDemoStore((state) => state.toggleVote);
  const reset = useDemoStore((state) => state.reset);

  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [localHideOthersCards, setLocalHideOthersCards] = useState(false);

  // サマリー生成用の状態
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSummaryUsed, setHasSummaryUsed] = useState(() => {
    const usedDate = localStorage.getItem(DEMO_SUMMARY_STORAGE_KEY);
    return usedDate === getTodayInJST();
  });

  const handleOpenSummaryDialog = useCallback(() => {
    setSummary('');
    setIsSummaryDialogOpen(true);
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    setIsGenerating(true);

    try {
      const itemsForApi = items
        .filter((item) => !DEMO_EXPLANATION_ITEM_IDS.includes(item.id))
        .map((item) => ({
          column: item.column,
          text: item.text,
        }));
      const result = await generateSummaryDemo(itemsForApi);
      setSummary(result.summary);
      localStorage.setItem(DEMO_SUMMARY_STORAGE_KEY, getTodayInJST());
      setHasSummaryUsed(true);
    } catch (error) {
      setIsSummaryDialogOpen(false);
      handleError(error, 'サマリーの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [items, handleError]);

  // ページ離脱時にリセット
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // タイマー開始時にデフォルトの表示設定を適用
  useEffect(() => {
    if (timerState?.startedAt) {
      setLocalHideOthersCards(timerState.hideOthersCards);
    } else {
      setLocalHideOthersCards(false);
    }
  }, [timerState?.startedAt, timerState?.hideOthersCards]);

  // クエリパラメータのitemIdに該当するアイテムのDetailPanelを開く
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (!itemId || items.length === 0) return;

    if (selectedItem?.id === itemId) return;

    const targetItem = items.find((item) => item.id === itemId);
    if (targetItem) {
      setSelectedItem(targetItem);
    }
  }, [searchParams, items, selectedItem, setSelectedItem]);

  const handleItemsChange = useCallback((newItems: KptItem[]) => {
    useDemoStore.setState({ items: newItems });
  }, []);

  const handleItemDrop = useCallback(
    (item: KptItem) => {
      updateItem(item);
    },
    [updateItem]
  );

  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy, displayItems } =
    useKPTCardDnD({
      columns,
      items,
      onItemsChange: handleItemsChange,
      onItemDrop: handleItemDrop,
    });

  const filteredItems = useMemo(() => {
    let result = displayItems;

    // タイマー中でカード非表示モードの場合、自分のカードのみ表示
    if (timerState?.startedAt && localHideOthersCards) {
      result = result.filter((item) => item.authorId === DEMO_USER_ID);
    }

    if (filter.tag) {
      result = result.filter((item) => item.text.includes(filter.tag!));
    }

    if (filter.memberId) {
      result = result.filter((item) => item.authorId === filter.memberId);
    }

    return result;
  }, [displayItems, filter.tag, filter.memberId, timerState?.startedAt, localHideOthersCards]);

  const itemsByColumn = useMemo(() => selectItemsByColumn(filteredItems, columns), [filteredItems]);
  const activeItem = useMemo(() => selectActiveItem(displayItems, activeId), [displayItems, activeId]);

  const handleAddCard = (text: string) => {
    addItem(newItemColumn, text);
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
  };

  const handleCardClick = useCallback(
    (item: KptItem) => {
      setSelectedItem(item);
      searchParams.set('itemId', item.id);
      setSearchParams(searchParams, { replace: true });
    },
    [setSelectedItem, searchParams, setSearchParams]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
    searchParams.delete('itemId');
    setSearchParams(searchParams, { replace: true });
  }, [setSelectedItem, searchParams, setSearchParams]);

  const handleTagClick = useCallback(
    (tag: string) => {
      setFilterTag(tag);
    },
    [setFilterTag]
  );

  const handleMemberClick = useCallback(
    (memberId: string) => {
      setFilterMemberId(memberId);
    },
    [setFilterMemberId]
  );

  const handleVote = useCallback(
    (itemId: string) => {
      toggleVote(itemId);
    },
    [toggleVote]
  );

  return (
    <>
      <title>デモボード - Simple KPT</title>
      <DemoBoardProvider>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <HeaderActions>
            <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4" />
              エクスポート
            </Button>
          </HeaderActions>

          <div className="flex h-full flex-col">
            <section className="mx-auto flex min-h-0 w-full max-w-480 flex-1 flex-col p-8">
              <header className="flex-none">
                <nav className="mb-2">
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded text-sm transition-colors hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    トップページに戻る
                  </Link>
                </nav>
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-2xl font-semibold">デモボード</h1>
                  <div className="flex items-center gap-2">
                    <SummaryButton
                      onClick={handleOpenSummaryDialog}
                      disabled={hasSummaryUsed}
                      title={hasSummaryUsed ? 'デモでは1回のみ利用可能です' : undefined}
                    />
                    <Timer />
                  </div>
                </div>
              </header>

              {/* フィルターバー */}
              {(filter.tag || filter.memberId) && (
                <div className="flex-none pt-4">
                  <FilterBar
                    filterTag={filter.tag}
                    filterMemberName={filter.memberId ? memberNicknameMap[filter.memberId] || '不明なメンバー' : null}
                    onRemoveTag={() => setFilterTag(null)}
                    onRemoveMember={() => setFilterMemberId(null)}
                  />
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col items-stretch gap-x-4 gap-y-4 overflow-y-auto py-4 lg:flex-row">
                <BoardColumn
                  column="keep"
                  items={itemsByColumn.keep}
                  selectedItemId={selectedItem?.id}
                  onDeleteItem={handleDeleteItem}
                  onCardClick={handleCardClick}
                  onTagClick={handleTagClick}
                  onMemberClick={handleMemberClick}
                  onVote={handleVote}
                  totalMemberCount={DEMO_MEMBERS.length}
                />
                <BoardColumn
                  column="problem"
                  items={itemsByColumn.problem}
                  selectedItemId={selectedItem?.id}
                  onDeleteItem={handleDeleteItem}
                  onCardClick={handleCardClick}
                  onTagClick={handleTagClick}
                  onMemberClick={handleMemberClick}
                  onVote={handleVote}
                  totalMemberCount={DEMO_MEMBERS.length}
                />
                <BoardColumn
                  column="try"
                  items={itemsByColumn.try}
                  selectedItemId={selectedItem?.id}
                  onDeleteItem={handleDeleteItem}
                  onCardClick={handleCardClick}
                  onTagClick={handleTagClick}
                  onMemberClick={handleMemberClick}
                  onVote={handleVote}
                  totalMemberCount={DEMO_MEMBERS.length}
                />
              </div>

              <div className="flex-none pt-4">
                <ItemAddForm
                  columns={columns}
                  selectedColumn={newItemColumn}
                  onColumnChange={setNewItemColumn}
                  onSubmit={handleAddCard}
                  disabled={false}
                />
              </div>
            </section>
          </div>

          {/* ドラッグ中にポインタに追従するカード */}
          <DragOverlay>
            {activeItem ? <KPTCard item={activeItem} onDelete={() => {}} onVote={() => {}} totalMemberCount={DEMO_MEMBERS.length} /> : null}
          </DragOverlay>

          {/* カード詳細パネル */}
          <ItemDetailPanel item={selectedItem} onClose={handleClosePanel} />

          {/* エクスポートダイアログ */}
          <ExportDialog boardName="デモボード" items={items} isOpen={exportDialogOpen} onOpenChange={setExportDialogOpen} />

          {/* AIサマリーダイアログ */}
          <SummaryDialog
            isOpen={isSummaryDialogOpen}
            onOpenChange={setIsSummaryDialogOpen}
            onGenerate={handleGenerateSummary}
            summary={summary}
            remainingCount={hasSummaryUsed ? 0 : 1}
            isLoading={isGenerating}
            boardName="デモボード"
          />
        </DndContext>
      </DemoBoardProvider>
    </>
  );
}
