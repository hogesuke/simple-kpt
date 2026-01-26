import { beforeEach, describe, expect, it } from 'vitest';

import { useHomeStore } from './useHomeStore';

describe('useHomeStore', () => {
  beforeEach(() => {
    // 状態を初期状態にリセット
    useHomeStore.setState({
      activeTab: 'boards',
      filterStatuses: ['pending', 'in_progress'],
      filterAssignee: null,
    });
  });

  describe('初期状態', () => {
    it('activeTabが"boards"であること', () => {
      const state = useHomeStore.getState();
      expect(state.activeTab).toBe('boards');
    });

    it('filterStatusesがデフォルト値であること', () => {
      const state = useHomeStore.getState();
      expect(state.filterStatuses).toEqual(['pending', 'in_progress']);
    });

    it('filterAssigneeがnullであること', () => {
      const state = useHomeStore.getState();
      expect(state.filterAssignee).toBeNull();
    });
  });

  describe('setActiveTab', () => {
    it('タブを"try"に変更できること', () => {
      useHomeStore.getState().setActiveTab('try');
      expect(useHomeStore.getState().activeTab).toBe('try');
    });

    it('タブを"boards"に変更できること', () => {
      useHomeStore.getState().setActiveTab('try');
      useHomeStore.getState().setActiveTab('boards');
      expect(useHomeStore.getState().activeTab).toBe('boards');
    });
  });

  describe('setFilterStatuses', () => {
    it('フィルターステータスを設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['done']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['done']);
    });

    it('複数のステータスを設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['pending', 'in_progress', 'done']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['pending', 'in_progress', 'done']);
    });

    it('空の配列を設定できること', () => {
      useHomeStore.getState().setFilterStatuses([]);
      expect(useHomeStore.getState().filterStatuses).toEqual([]);
    });

    it('wont_fixステータスを含めて設定できること', () => {
      useHomeStore.getState().setFilterStatuses(['wont_fix']);
      expect(useHomeStore.getState().filterStatuses).toEqual(['wont_fix']);
    });

    it('全てのステータスを設定できること', () => {
      const allStatuses = ['pending', 'in_progress', 'done', 'wont_fix'] as const;
      useHomeStore.getState().setFilterStatuses([...allStatuses]);
      expect(useHomeStore.getState().filterStatuses).toEqual([...allStatuses]);
    });
  });

  describe('setFilterAssignee', () => {
    it('担当者フィルターを設定できること', () => {
      const assignee = { id: 'user-1', nickname: 'テストユーザー' };
      useHomeStore.getState().setFilterAssignee(assignee);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee);
    });

    it('担当者フィルターをnullにできること', () => {
      const assignee = { id: 'user-1', nickname: 'テストユーザー' };
      useHomeStore.getState().setFilterAssignee(assignee);
      useHomeStore.getState().setFilterAssignee(null);
      expect(useHomeStore.getState().filterAssignee).toBeNull();
    });

    it('異なる担当者に変更できること', () => {
      const assignee1 = { id: 'user-1', nickname: 'ユーザー1' };
      const assignee2 = { id: 'user-2', nickname: 'ユーザー2' };

      useHomeStore.getState().setFilterAssignee(assignee1);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee1);

      useHomeStore.getState().setFilterAssignee(assignee2);
      expect(useHomeStore.getState().filterAssignee).toEqual(assignee2);
    });
  });

  describe('複合操作', () => {
    it('タブ変更とフィルター変更が独立して動作すること', () => {
      useHomeStore.getState().setActiveTab('try');
      useHomeStore.getState().setFilterStatuses(['done']);
      useHomeStore.getState().setFilterAssignee({ id: 'user-1', nickname: 'テスト' });

      const state = useHomeStore.getState();
      expect(state.activeTab).toBe('try');
      expect(state.filterStatuses).toEqual(['done']);
      expect(state.filterAssignee).toEqual({ id: 'user-1', nickname: 'テスト' });
    });

    it('フィルター変更がタブに影響しないこと', () => {
      useHomeStore.getState().setFilterStatuses(['done', 'wont_fix']);

      expect(useHomeStore.getState().activeTab).toBe('boards');
    });

    it('タブ変更がフィルターに影響しないこと', () => {
      useHomeStore.getState().setFilterStatuses(['done']);
      useHomeStore.getState().setFilterAssignee({ id: 'user-1', nickname: 'テスト' });
      useHomeStore.getState().setActiveTab('try');

      const state = useHomeStore.getState();
      expect(state.filterStatuses).toEqual(['done']);
      expect(state.filterAssignee).toEqual({ id: 'user-1', nickname: 'テスト' });
    });
  });
});
