import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { TryStatus } from '@/types/kpt';

type HomeTab = 'boards' | 'try';

interface FilterAssignee {
  id: string;
  nickname: string;
}

const DEFAULT_STATUSES: TryStatus[] = ['pending', 'in_progress'];

interface HomeState {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
  filterStatuses: TryStatus[];
  setFilterStatuses: (statuses: TryStatus[]) => void;
  filterAssignee: FilterAssignee | null;
  setFilterAssignee: (assignee: FilterAssignee | null) => void;
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set) => ({
      activeTab: 'boards',
      setActiveTab: (tab) => set({ activeTab: tab }),
      filterStatuses: DEFAULT_STATUSES,
      setFilterStatuses: (statuses) => set({ filterStatuses: statuses }),
      filterAssignee: null,
      setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),
    }),
    { name: 'HomeStore', enabled: import.meta.env.DEV }
  )
);
