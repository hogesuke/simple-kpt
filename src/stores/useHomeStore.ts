import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import i18n from '@/i18n';
import { fetchBoards, fetchTryItems } from '@/lib/kpt-api';

import type { KptBoard, TryItemWithBoard, TryStatus } from '@/types/kpt';

type HomeTab = 'boards' | 'try';

interface FilterAssignee {
  id: string;
  nickname: string;
}

const DEFAULT_STATUSES: TryStatus[] = ['pending', 'in_progress'];
const PAGE_SIZE = 20;

interface HomeState {
  // タブ
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;

  // ボード関連
  boards: KptBoard[];
  isBoardsLoading: boolean;
  isBoardsLoadingMore: boolean;
  boardsError: string | null;
  boardsCursor: string | null;
  boardsHasMore: boolean;
  loadBoards: (reset?: boolean) => Promise<void>;
  addBoard: (board: KptBoard) => void;
  updateBoard: (boardId: string, updatedBoard: KptBoard) => void;
  removeBoard: (boardId: string) => void;

  // Tryアイテム関連
  tryItems: TryItemWithBoard[];
  isTryLoading: boolean;
  isTryLoadingMore: boolean;
  tryError: string | null;
  tryOffset: number;
  tryHasMore: boolean;
  hasTryLoaded: boolean;
  filterStatuses: TryStatus[];
  setFilterStatuses: (statuses: TryStatus[]) => void;
  filterAssignee: FilterAssignee | null;
  setFilterAssignee: (assignee: FilterAssignee | null) => void;
  loadTryItems: (reset?: boolean) => Promise<void>;
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set, get) => ({
      // タブ
      activeTab: 'boards',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ボード関連
      boards: [],
      isBoardsLoading: true,
      isBoardsLoadingMore: false,
      boardsError: null,
      boardsCursor: null,
      boardsHasMore: false,

      loadBoards: async (reset = true) => {
        const { boardsCursor, isBoardsLoadingMore } = get();
        if (!reset && (!boardsCursor || isBoardsLoadingMore)) return;

        if (reset) {
          set({ isBoardsLoading: true, boardsError: null });
        } else {
          set({ isBoardsLoadingMore: true });
        }

        try {
          const cursor = reset ? undefined : (boardsCursor ?? undefined);
          const response = await fetchBoards({ limit: PAGE_SIZE, cursor });

          if (reset) {
            set({ boards: response.items });
          } else {
            set((state) => ({ boards: [...state.boards, ...response.items] }));
          }
          set({
            boardsCursor: response.nextCursor,
            boardsHasMore: response.hasMore,
          });
        } catch {
          if (reset) {
            set({ boardsError: i18n.t('error:ボードリストの読み込みに失敗しました') });
          }
          // 追加読み込み時のエラーはtoastで表示するため、ここでは何もしない
        } finally {
          set({ isBoardsLoading: false, isBoardsLoadingMore: false });
        }
      },

      addBoard: (board) => set((state) => ({ boards: [board, ...state.boards] })),

      updateBoard: (boardId, updatedBoard) =>
        set((state) => ({
          boards: state.boards.map((board) => (board.id === boardId ? updatedBoard : board)),
        })),

      removeBoard: (boardId) =>
        set((state) => ({
          boards: state.boards.filter((board) => board.id !== boardId),
        })),

      // Tryアイテム関連
      tryItems: [],
      isTryLoading: false,
      isTryLoadingMore: false,
      tryError: null,
      tryOffset: 0,
      tryHasMore: false,
      hasTryLoaded: false,
      filterStatuses: DEFAULT_STATUSES,
      setFilterStatuses: (statuses) => set({ filterStatuses: statuses }),
      filterAssignee: null,
      setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),

      loadTryItems: async (reset = true) => {
        const { tryOffset, isTryLoadingMore, filterStatuses, filterAssignee } = get();
        if (!reset && isTryLoadingMore) return;

        if (reset) {
          set({ isTryLoading: true, tryOffset: 0, tryError: null });
        } else {
          set({ isTryLoadingMore: true });
        }

        try {
          const offset = reset ? 0 : tryOffset;
          const response = await fetchTryItems({
            status: filterStatuses.length > 0 ? filterStatuses : undefined,
            assigneeId: filterAssignee?.id,
            limit: PAGE_SIZE,
            offset,
          });

          if (reset) {
            set({ tryItems: response.items });
          } else {
            set((state) => ({ tryItems: [...state.tryItems, ...response.items] }));
          }
          set({
            tryOffset: offset + response.items.length,
            tryHasMore: response.hasMore,
          });
        } catch {
          set({ tryError: i18n.t('error:Tryアイテムの読み込みに失敗しました') });
        } finally {
          if (reset) {
            set({ isTryLoading: false, hasTryLoaded: true });
          } else {
            set({ isTryLoadingMore: false });
          }
        }
      },
    }),
    { name: 'HomeStore', enabled: import.meta.env.DEV }
  )
);
