import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type HomeTab = 'boards' | 'try';

interface HomeState {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set) => ({
      activeTab: 'boards',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: 'HomeStore' }
  )
);
