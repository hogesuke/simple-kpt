/* eslint-disable vitest/no-conditional-expect */
import { beforeEach, describe, expect, it } from 'vitest';

import { DEMO_MEMBERS, useDemoStore } from './useDemoStore';

describe('useDemoStore', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  describe('初期状態', () => {
    it('初期アイテムが正しく設定されていること', () => {
      const state = useDemoStore.getState();

      expect(state.items.length).toBeGreaterThan(0);
      expect(state.selectedItem).toBeNull();
      expect(state.filter.tag).toBeNull();
      expect(state.filter.memberId).toBeNull();
      expect(state.timerState).toBeNull();
    });

    it('memberNicknameMapが正しく設定されていること', () => {
      const state = useDemoStore.getState();

      DEMO_MEMBERS.forEach((member) => {
        expect(state.memberNicknameMap[member.userId]).toBe(member.nickname);
      });
    });

    it('各カラムにアイテムが存在すること', () => {
      const state = useDemoStore.getState();

      const keepItems = state.items.filter((item) => item.column === 'keep');
      const problemItems = state.items.filter((item) => item.column === 'problem');
      const tryItems = state.items.filter((item) => item.column === 'try');

      expect(keepItems.length).toBeGreaterThan(0);
      expect(problemItems.length).toBeGreaterThan(0);
      expect(tryItems.length).toBeGreaterThan(0);
    });
  });

  describe('addItem', () => {
    it('keepカラムにアイテムを追加できること', () => {
      const initialCount = useDemoStore.getState().items.filter((i) => i.column === 'keep').length;

      useDemoStore.getState().addItem('keep', 'テストKeep');

      const state = useDemoStore.getState();
      const keepItems = state.items.filter((i) => i.column === 'keep');

      expect(keepItems.length).toBe(initialCount + 1);
      expect(keepItems.some((i) => i.text === 'テストKeep')).toBe(true);
    });

    it('problemカラムにアイテムを追加できること', () => {
      const initialCount = useDemoStore.getState().items.filter((i) => i.column === 'problem').length;

      useDemoStore.getState().addItem('problem', 'テストProblem');

      const state = useDemoStore.getState();
      const problemItems = state.items.filter((i) => i.column === 'problem');

      expect(problemItems.length).toBe(initialCount + 1);
      expect(problemItems.some((i) => i.text === 'テストProblem')).toBe(true);
    });

    it('tryカラムにアイテムを追加するとstatusがpendingになること', () => {
      useDemoStore.getState().addItem('try', 'テストTry');

      const state = useDemoStore.getState();
      const addedItem = state.items.find((i) => i.text === 'テストTry');

      expect(addedItem).toBeDefined();
      expect(addedItem?.column).toBe('try');
      expect(addedItem?.status).toBe('pending');
    });

    it('positionがカラム内の最大値+1000になること', () => {
      const state = useDemoStore.getState();
      const keepItems = state.items.filter((i) => i.column === 'keep');
      const maxPosition = Math.max(...keepItems.map((i) => i.position));

      useDemoStore.getState().addItem('keep', '新しいKeep');

      const newState = useDemoStore.getState();
      const newItem = newState.items.find((i) => i.text === '新しいKeep');

      expect(newItem?.position).toBe(maxPosition + 1000);
    });

    it('空のカラムに追加した場合positionが1000になること', () => {
      // 全てのアイテムを削除
      const state = useDemoStore.getState();
      state.items.filter((i) => i.column === 'keep').forEach((i) => useDemoStore.getState().deleteItem(i.id));

      useDemoStore.getState().addItem('keep', '最初のKeep');

      const newState = useDemoStore.getState();
      const newItem = newState.items.find((i) => i.text === '最初のKeep');

      expect(newItem?.position).toBe(1000);
    });

    it('追加されたアイテムにauthorIdとauthorNicknameが設定されること', () => {
      useDemoStore.getState().addItem('keep', 'テスト');

      const state = useDemoStore.getState();
      const addedItem = state.items.find((i) => i.text === 'テスト');

      expect(addedItem?.authorId).toBe('demo-user-1');
      expect(addedItem?.authorNickname).toBe('デモユーザーくん');
    });
  });

  describe('updateItem', () => {
    it('アイテムを更新できること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];
      const updatedItem = { ...item, text: '更新されたテキスト' };

      useDemoStore.getState().updateItem(updatedItem);

      const newState = useDemoStore.getState();
      const updated = newState.items.find((i) => i.id === item.id);

      expect(updated?.text).toBe('更新されたテキスト');
    });

    it('更新時にupdatedAtが設定されること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];
      const updatedItem = { ...item, text: '更新テスト' };

      useDemoStore.getState().updateItem(updatedItem);

      const newState = useDemoStore.getState();
      const updated = newState.items.find((i) => i.id === item.id);

      expect(updated?.updatedAt).toBeDefined();
    });

    it('選択中のアイテムを更新すると、selectedItemも更新されること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];

      useDemoStore.getState().setSelectedItem(item);
      expect(useDemoStore.getState().selectedItem?.id).toBe(item.id);

      const updatedItem = { ...item, text: '選択中の更新' };
      useDemoStore.getState().updateItem(updatedItem);

      const newState = useDemoStore.getState();
      expect(newState.selectedItem?.text).toBe('選択中の更新');
    });

    it('存在しないアイテムを更新しようとしても何も起こらないこと', () => {
      const initialState = useDemoStore.getState();
      const initialItems = [...initialState.items];

      const fakeItem = {
        id: 'non-existent-id',
        boardId: 'demo',
        column: 'keep' as const,
        text: 'fake',
        position: 0,
        authorId: 'demo',
        authorNickname: 'demo',
        createdAt: new Date().toISOString(),
      };

      useDemoStore.getState().updateItem(fakeItem);

      const newState = useDemoStore.getState();
      expect(newState.items.length).toBe(initialItems.length);
    });
  });

  describe('deleteItem', () => {
    it('アイテムを削除できること', () => {
      const state = useDemoStore.getState();
      const initialCount = state.items.length;
      const itemToDelete = state.items[0];

      useDemoStore.getState().deleteItem(itemToDelete.id);

      const newState = useDemoStore.getState();
      expect(newState.items.length).toBe(initialCount - 1);
      expect(newState.items.find((i) => i.id === itemToDelete.id)).toBeUndefined();
    });

    it('選択中のアイテムを削除するとselectedItemがnullになること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];

      useDemoStore.getState().setSelectedItem(item);
      expect(useDemoStore.getState().selectedItem?.id).toBe(item.id);

      useDemoStore.getState().deleteItem(item.id);

      expect(useDemoStore.getState().selectedItem).toBeNull();
    });

    it('選択中でないアイテムを削除してもselectedItemは変わらないこと', () => {
      const state = useDemoStore.getState();
      const selectedItem = state.items[0];
      const otherItem = state.items[1];

      useDemoStore.getState().setSelectedItem(selectedItem);
      useDemoStore.getState().deleteItem(otherItem.id);

      expect(useDemoStore.getState().selectedItem?.id).toBe(selectedItem.id);
    });
  });

  describe('setSelectedItem', () => {
    it('アイテムを選択できること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];

      useDemoStore.getState().setSelectedItem(item);

      expect(useDemoStore.getState().selectedItem).toEqual(item);
    });

    it('選択をnullにできること', () => {
      const state = useDemoStore.getState();
      const item = state.items[0];

      useDemoStore.getState().setSelectedItem(item);
      useDemoStore.getState().setSelectedItem(null);

      expect(useDemoStore.getState().selectedItem).toBeNull();
    });
  });

  describe('setFilterTag', () => {
    it('タグフィルターを設定できること', () => {
      useDemoStore.getState().setFilterTag('#doc');

      expect(useDemoStore.getState().filter.tag).toBe('#doc');
    });

    it('タグフィルターをnullにできること', () => {
      useDemoStore.getState().setFilterTag('#doc');
      useDemoStore.getState().setFilterTag(null);

      expect(useDemoStore.getState().filter.tag).toBeNull();
    });
  });

  describe('setFilterMemberId', () => {
    it('メンバーフィルターを設定できること', () => {
      useDemoStore.getState().setFilterMemberId('demo-user-1');

      expect(useDemoStore.getState().filter.memberId).toBe('demo-user-1');
    });

    it('メンバーフィルターをnullにできること', () => {
      useDemoStore.getState().setFilterMemberId('demo-user-1');
      useDemoStore.getState().setFilterMemberId(null);

      expect(useDemoStore.getState().filter.memberId).toBeNull();
    });
  });

  describe('startTimer', () => {
    it('タイマーを開始できること', () => {
      useDemoStore.getState().startTimer(300, false);

      const state = useDemoStore.getState();
      expect(state.timerState).not.toBeNull();
      expect(state.timerState?.durationSeconds).toBe(300);
      expect(state.timerState?.hideOthersCards).toBe(false);
      expect(state.timerState?.startedBy).toBe('demo-user-1');
    });

    it('タイマーのhideOthersCardsを設定できること', () => {
      useDemoStore.getState().startTimer(180, true);

      const state = useDemoStore.getState();
      expect(state.timerState?.hideOthersCards).toBe(true);
    });

    it('タイマーにstartedAtが設定されること', () => {
      const before = new Date().toISOString();
      useDemoStore.getState().startTimer(300, false);
      const after = new Date().toISOString();

      const state = useDemoStore.getState();
      expect(state.timerState?.startedAt).toBeDefined();
      expect(state.timerState!.startedAt! >= before).toBe(true);
      expect(state.timerState!.startedAt! <= after).toBe(true);
    });
  });

  describe('stopTimer', () => {
    it('タイマーを停止できること', () => {
      useDemoStore.getState().startTimer(300, false);
      expect(useDemoStore.getState().timerState).not.toBeNull();

      useDemoStore.getState().stopTimer();

      expect(useDemoStore.getState().timerState).toBeNull();
    });
  });

  describe('toggleVote', () => {
    it('投票を追加できること', () => {
      const state = useDemoStore.getState();
      const item = state.items.find((i) => !i.hasVoted);
      expect(item).toBeDefined();

      const initialVoteCount = item!.voteCount ?? 0;

      useDemoStore.getState().toggleVote(item!.id);

      const newState = useDemoStore.getState();
      const updatedItem = newState.items.find((i) => i.id === item!.id);

      expect(updatedItem?.hasVoted).toBe(true);
      expect(updatedItem?.voteCount).toBe(initialVoteCount + 1);
      expect(updatedItem?.voters?.some((v) => v.id === 'demo-user-1')).toBe(true);
    });

    it('投票を取り消しできること', () => {
      const state = useDemoStore.getState();
      const item = state.items.find((i) => i.hasVoted);
      expect(item).toBeDefined();

      const initialVoteCount = item!.voteCount ?? 0;

      useDemoStore.getState().toggleVote(item!.id);

      const newState = useDemoStore.getState();
      const updatedItem = newState.items.find((i) => i.id === item!.id);

      expect(updatedItem?.hasVoted).toBe(false);
      expect(updatedItem?.voteCount).toBe(initialVoteCount - 1);
      expect(updatedItem?.voters?.some((v) => v.id === 'demo-user-1')).toBe(false);
    });

    it('投票数が0未満にならないこと', () => {
      const state = useDemoStore.getState();
      // 投票されていないアイテムを見つける
      const item = state.items.find((i) => (i.voteCount ?? 0) === 0 && !i.hasVoted);

      if (item) {
        // voteCountを0に設定したアイテムでトグル（通常は+1になる）
        useDemoStore.getState().toggleVote(item.id);
        useDemoStore.getState().toggleVote(item.id); // 取り消し

        const newState = useDemoStore.getState();
        const updatedItem = newState.items.find((i) => i.id === item.id);

        expect(updatedItem?.voteCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('選択中のアイテムの投票を変更するとselectedItemも更新されること', () => {
      const state = useDemoStore.getState();
      const item = state.items.find((i) => !i.hasVoted);
      expect(item).toBeDefined();

      useDemoStore.getState().setSelectedItem(item!);
      useDemoStore.getState().toggleVote(item!.id);

      const newState = useDemoStore.getState();
      expect(newState.selectedItem?.hasVoted).toBe(true);
    });

    it('存在しないアイテムの投票を変更しようとしても何も起こらないこと', () => {
      const initialState = useDemoStore.getState();
      const initialItems = JSON.stringify(initialState.items);

      useDemoStore.getState().toggleVote('non-existent-id');

      const newState = useDemoStore.getState();
      expect(JSON.stringify(newState.items)).toBe(initialItems);
    });
  });

  describe('reset', () => {
    it('状態を初期状態にリセットできること', () => {
      // 状態を変更
      useDemoStore.getState().addItem('keep', 'テスト追加');
      useDemoStore.getState().setSelectedItem(useDemoStore.getState().items[0]);
      useDemoStore.getState().setFilterTag('#test');
      useDemoStore.getState().setFilterMemberId('demo-user-1');
      useDemoStore.getState().startTimer(300, true);

      // リセット
      useDemoStore.getState().reset();

      const state = useDemoStore.getState();
      expect(state.selectedItem).toBeNull();
      expect(state.filter.tag).toBeNull();
      expect(state.filter.memberId).toBeNull();
      expect(state.timerState).toBeNull();
      // リセット後は初期アイテムに戻る（追加したアイテムは消える）
      expect(state.items.find((i) => i.text === 'テスト追加')).toBeUndefined();
    });
  });
});
