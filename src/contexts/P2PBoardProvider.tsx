import { ReactNode, useCallback, useMemo, useState, useSyncExternalStore } from 'react';

import { BoardContextProvider, BoardContextValue } from '@/contexts/BoardContext';
import { storeNickname } from '@/lib/p2p/identity';
import * as kptDoc from '@/lib/p2p/kpt-doc';

import type { P2PRoom } from '@/lib/p2p/p2p-room';
import type { BoardMember, KptColumnType, KptItem, TimerState } from '@/types/kpt';

interface FilterState {
  tag: string | null;
  memberId: string | null;
}

interface P2PBoardProviderProps {
  room: P2PRoom;
  children: ReactNode;
}

export function P2PBoardProvider({ room, children }: P2PBoardProviderProps) {
  const snapshot = useSyncExternalStore(room.subscribe, room.getSnapshot);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({ tag: null, memberId: null });

  const { items, participants, timer, clockOffset } = snapshot;

  // 他の参加者による更新を反映するため、選択中のアイテムはIDから毎回引き直す
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  // タイマーの開始時刻をルーム時刻からローカル時刻に変換する（Timerコンポーネントはローカル時刻で残り時間を計算するため）
  // 時間切れ・時計の同期前の判定はP2PRoomで行い、実行中のタイマーだけが渡される
  const timerState: TimerState | null = useMemo(
    () =>
      timer
        ? {
            startedAt: new Date(timer.startedAtRoomTime - clockOffset).toISOString(),
            durationSeconds: timer.durationSeconds,
            hideOthersCards: timer.hideOthersCards,
            startedBy: timer.startedBy,
          }
        : null,
    [timer, clockOffset]
  );

  const members: BoardMember[] = useMemo(
    () =>
      participants.map((participant) => ({
        id: participant.userId,
        userId: participant.userId,
        nickname: participant.nickname,
        role: 'member',
        createdAt: '',
      })),
    [participants]
  );

  // 退出済みの参加者のニックネームもアイテムの作成者情報から引けるようにする
  const memberNicknameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      if (item.authorId && item.authorNickname) map[item.authorId] = item.authorNickname;
    }
    for (const participant of participants) {
      map[participant.userId] = participant.nickname;
    }
    return map;
  }, [items, participants]);

  // ボードの容量が上限に近い場合は、自分の変更を受け付けない（他の参加者に届かず、参加者ごとに内容が食い違うのを防ぐ）
  // 削除・タイマーの停止は容量をほとんど増やさないため、引き続き行えるようにする
  const addItem = useCallback(
    (column: KptColumnType, text: string) => {
      if (room.isBoardFull()) return;
      kptDoc.addItem(room.doc, { column, text, authorId: room.userId, authorNickname: room.getNickname() });
    },
    [room]
  );

  const updateItem = useCallback(
    (item: KptItem) => {
      if (room.isBoardFull()) return;
      kptDoc.updateItem(room.doc, item);
    },
    [room]
  );

  const deleteItem = useCallback(
    (id: string) => {
      kptDoc.deleteItem(room.doc, id);
      setSelectedItemId((current) => (current === id ? null : current));
    },
    [room]
  );

  const toggleVote = useCallback(
    (itemId: string) => {
      if (room.isBoardFull()) return;
      kptDoc.toggleVote(room.doc, itemId, room.userId, room.getNickname());
    },
    [room]
  );

  const setSelectedItem = useCallback((item: KptItem | null) => setSelectedItemId(item?.id ?? null), []);

  // ドラッグ終了時はupdateItemでY.Docが即時に更新されるため、ローカルでの一時的な並び替えは不要
  const setItems = useCallback(() => {}, []);

  const setFilterTag = useCallback((tag: string | null) => setFilter((prev) => ({ ...prev, tag })), []);
  const setFilterMemberId = useCallback((memberId: string | null) => setFilter((prev) => ({ ...prev, memberId })), []);

  const startTimer = useCallback(
    (durationSeconds: number, hideOthersCards: boolean) => {
      if (room.isBoardFull()) return;
      kptDoc.setTimer(room.doc, {
        startedAtRoomTime: room.clock.now(),
        durationSeconds,
        hideOthersCards,
        startedBy: room.userId,
      });
    },
    [room]
  );

  const stopTimer = useCallback(
    (options?: { expired?: boolean }) => {
      // 時間切れによる停止は各自の画面で判定するため、ルーム全体の状態は書き換えない
      if (options?.expired) return;
      kptDoc.setTimer(room.doc, null);
    },
    [room]
  );

  // ボードの中で変更したニックネームは、端末に保存したニックネームにも反映する（以降のボードでも使うため）
  const changeNickname = useCallback(
    (nickname: string) => {
      room.setNickname(nickname);
      storeNickname(nickname);
    },
    [room]
  );

  const value: BoardContextValue = useMemo(
    () => ({
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      isLoading: false,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      toggleVote,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      changeNickname,
      isDemo: false,
      currentUserId: room.userId,
    }),
    [
      items,
      selectedItem,
      filter,
      timerState,
      memberNicknameMap,
      members,
      addItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setItems,
      toggleVote,
      setFilterTag,
      setFilterMemberId,
      startTimer,
      stopTimer,
      changeNickname,
      room,
    ]
  );

  return <BoardContextProvider value={value}>{children}</BoardContextProvider>;
}
