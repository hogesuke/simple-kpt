import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Download, Link as LinkIcon } from 'lucide-react';
import { FormEvent, ReactElement, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { ExportDialog } from '@/components/board/ExportDialog';
import { RoomShareDialog } from '@/components/board/RoomShareDialog';
import { BoardColumn } from '@/components/kpt/BoardColumn';
import { FilterBar } from '@/components/kpt/FilterBar';
import { ItemAddForm } from '@/components/kpt/ItemAddForm';
import { ItemDetailPanel } from '@/components/kpt/ItemDetailPanel';
import { KPTCard } from '@/components/kpt/KPTCard';
import { ParticipantList } from '@/components/kpt/ParticipantList';
import { Timer } from '@/components/kpt/Timer';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useBoardContext } from '@/contexts/BoardContext';
import { P2PBoardProvider } from '@/contexts/P2PBoardProvider';
import { useKPTCardDnD } from '@/hooks/useKPTCardDnD';
import { useParticipantNotifications } from '@/hooks/useParticipantNotifications';
import i18n from '@/i18n';
import { copyToClipboard } from '@/lib/export-helpers';
import { selectActiveItem, selectItemsByColumn } from '@/lib/item-selectors';
import { getOrCreateUserId, getStoredNickname, normalizeNickname, storeNickname } from '@/lib/p2p/identity';
import { initializeBoard, ItemLimitExceededError, moveItem } from '@/lib/p2p/kpt-doc';
import { P2PRoom } from '@/lib/p2p/p2p-room';
import { isRoomCreator, parseSecretFromHash } from '@/lib/p2p/room-link';
import { loadRoomState, pruneStoredRooms, saveRoomState } from '@/lib/p2p/room-store';
import { buildSignalingRoomUrl, createRoomKey, getSignalingUrl } from '@/lib/p2p/signaling';
import { captureException } from '@/lib/sentry';
import { NICKNAME_MAX_LENGTH, VALID_COLUMNS } from '@shared/constants';

import type { NewRoomState } from '@/pages/NewRoom';
import type { KptColumnType, KptItem } from '@/types/kpt';

export function P2PBoard(): ReactElement {
  const { t } = useTranslation('room');
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const secret = parseSecretFromHash(location.hash);
  const [nickname, setNickname] = useState(() => getStoredNickname());

  if (!roomId || !secret) {
    return (
      <section className="mx-auto flex h-full max-w-240 items-center justify-center px-4">
        <p className="text-destructive text-sm">{t('ルームのURLが正しくありません。共有されたURLをそのまま開いてください。')}</p>
      </section>
    );
  }

  if (!nickname) {
    return <NicknameForm onSubmit={setNickname} />;
  }

  return <P2PRoomContainer key={roomId} roomId={roomId} secret={secret} nickname={nickname} />;
}

interface NicknameFormProps {
  onSubmit: (nickname: string) => void;
}

function NicknameForm({ onSubmit }: NicknameFormProps): ReactElement {
  const { t } = useTranslation('room');
  const [value, setValue] = useState('');
  const normalized = normalizeNickname(value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalized) return;
    storeNickname(normalized);
    onSubmit(normalized);
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">{t('ボードに参加')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="join-nickname">{t('ニックネーム')}</Label>
          <Input
            className="bg-card"
            id="join-nickname"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={NICKNAME_MAX_LENGTH}
            required
          />
        </div>
        <Button className="mt-2 h-11" type="submit" disabled={!normalized}>
          {t('参加する')}
        </Button>
      </form>
    </section>
  );
}

interface P2PRoomContainerProps {
  roomId: string;
  secret: string;
  nickname: string;
}

function P2PRoomContainer({ roomId, secret, nickname }: P2PRoomContainerProps): ReactElement | null {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('room');
  const [room, setRoom] = useState<P2PRoom | null>(null);
  const [hasSetupError, setHasSetupError] = useState(false);
  // ルーム作成直後（作成画面から遷移してきた場合）のみ、招待URLの案内を表示する
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(() => Boolean((location.state as NewRoomState | null)?.initialBoard));

  // 作成画面から遷移してきた直後か（マウント時の値を使う。初期化後に履歴のstateを消すため）
  const [isNewlyCreated] = useState(() => Boolean((location.state as NewRoomState | null)?.initialBoard));

  useEffect(() => {
    let isCancelled = false;
    let newRoom: P2PRoom | null = null;

    // ルームキーの生成は非同期のため、生成後に接続する
    // （StrictModeによるマウント直後のアンマウントでは、生成完了前にキャンセルされるため接続しない）
    // 端末に保存しておいた状態があれば、接続前に復元して続きから再開する
    Promise.all([createRoomKey(roomId, secret), loadRoomState(roomId)])
      .then(([roomKey, storedState]) => {
        if (isCancelled) return;
        newRoom = new P2PRoom({
          roomId,
          secret,
          userId: getOrCreateUserId(),
          nickname,
          // ルームを作成した直後のみ自分の時計を基準にする（リロード時は、すでに同期済みの参加者の時計に合わせる）
          isClockReference: isNewlyCreated && isRoomCreator(roomId),
          signalingRoomKey: roomKey,
          signalingRoomUrl: buildSignalingRoomUrl(getSignalingUrl(), roomKey),
          persist: (state, boardName) => void saveRoomState({ roomId, secret, boardName, state }),
          onRemoteExport: (exporterNickname) => toast(i18n.t('room:{{name}}さんがエクスポートしました', { name: exporterNickname })),
        });
        // 保存データが壊れている、または大きすぎる場合は復元せず、他の参加者から同期する
        if (storedState && !newRoom.restore(storedState)) {
          toast.error(i18n.t('room:この端末に保存したボードを読み込めませんでした。他の参加者から同期します'));
        }
        newRoom.connect();
        setRoom(newRoom);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        captureException(error, { context: 'P2Pルームの接続準備' });
        setHasSetupError(true);
      });

    // 開いているルームは、保持期間を過ぎていても削除しない（開き直した時点で保存し直されるため）
    void pruneStoredRooms(Date.now(), [roomId]);

    return () => {
      isCancelled = true;
      newRoom?.destroy();
      setRoom(null);
    };
    // ニックネームはルーム参加時に確定するため、変更されても再接続しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, secret]);

  // ルーム作成直後のみ、作成画面から渡された内容で初期化する（インポートはこの時点でのみ可能）
  const initialBoard = (location.state as NewRoomState | null)?.initialBoard;
  useEffect(() => {
    if (!room || !initialBoard || !isRoomCreator(roomId)) return;

    initializeBoard(room.doc, initialBoard);
    // 再開用ファイルから作成した場合、ファイルに記録された自分の名前を今のニックネームにそろえる
    room.syncOwnNickname();
    // リロード時に再度初期化されないよう、履歴のstateを消す（#以降の鍵は残す）
    navigate(`${location.pathname}${location.hash}`, { replace: true, state: null });
  }, [room, initialBoard, roomId, navigate, location.pathname, location.hash]);

  useFlushPersistOnHide(room);
  useLeaveWarning(room);

  if (hasSetupError) {
    return (
      <section className="mx-auto flex h-full max-w-240 items-center justify-center px-4">
        <p className="text-destructive text-sm">{t('ボードへの接続を準備できませんでした')}</p>
      </section>
    );
  }

  if (!room) return null;

  return (
    <P2PBoardProvider room={room}>
      <P2PBoardContent room={room} />
      <RoomShareDialog roomUrl={window.location.href} isOpen={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} />
    </P2PBoardProvider>
  );
}

/**
 * タブを閉じる・切り替える際に、保存待ちの変更をすぐに端末へ保存する
 */
function useFlushPersistOnHide(room: P2PRoom | null): void {
  useEffect(() => {
    if (!room) return;

    const flush = () => room.flushPersist();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
  }, [room]);
}

/**
 * 最後のエクスポートより後にボードが変更されている状態で離脱しようとした場合に警告する
 * （ほかの参加者が同時に退出する場合や、端末の保存データが消える場合に備え、人数にかかわらず警告する）
 */
function useLeaveWarning(room: P2PRoom | null): void {
  useEffect(() => {
    if (!room) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!room.getSnapshot().hasUnexportedChanges) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [room]);
}

interface P2PBoardContentProps {
  room: P2PRoom;
}

function P2PBoardContent({ room }: P2PBoardContentProps): ReactElement {
  const { t } = useTranslation();
  const {
    name: boardName,
    peerCount,
    hasUnexportedChanges,
    isClockSynced,
    isBoardFull,
    hidesOthersCards,
  } = useSyncExternalStore(room.subscribe, room.getSnapshot);
  const {
    items,
    selectedItem,
    filter,
    members,
    memberNicknameMap,
    currentUserId,
    addItem,
    deleteItem,
    setSelectedItem,
    setFilterTag,
    setFilterMemberId,
    toggleVote,
  } = useBoardContext();

  const [newItemColumn, setNewItemColumn] = useState<KptColumnType>('keep');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useParticipantNotifications(members, currentUserId);

  // ドロップ時は移動に関わる項目だけを書き込む（ドラッグ中の他の参加者の編集を上書きしないため）
  const handleItemDrop = useCallback(
    (item: KptItem) => moveItem(room.doc, item.id, { column: item.column, position: item.position }),
    [room]
  );

  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel, collisionDetectionStrategy, displayItems } =
    useKPTCardDnD({
      columns: VALID_COLUMNS,
      items,
      // ドロップ時にonItemDropでY.Docを更新するため、ここでは何もしない
      onItemsChange: () => {},
      onItemDrop: handleItemDrop,
    });

  const filteredItems = useMemo(() => {
    let result = displayItems;

    // タイマー中でカード非表示モードの場合、自分のカードのみ表示（ルーム時計の同期前も隠す側に倒す）
    if (hidesOthersCards) {
      result = result.filter((item) => item.authorId === currentUserId);
    }

    if (filter.tag) {
      result = result.filter((item) => item.text.includes(filter.tag!));
    }

    if (filter.memberId) {
      result = result.filter((item) => item.authorId === filter.memberId);
    }

    return result;
  }, [displayItems, filter.tag, filter.memberId, hidesOthersCards, currentUserId]);

  const itemsByColumn = useMemo(() => selectItemsByColumn(filteredItems, VALID_COLUMNS), [filteredItems]);
  const activeItem = useMemo(() => selectActiveItem(displayItems, activeId), [displayItems, activeId]);

  const handleAddCard = (text: string) => {
    try {
      void addItem(newItemColumn, text);
    } catch (error) {
      if (error instanceof ItemLimitExceededError) {
        toast.error(t('room:アイテム数が上限に達しています'));
        return;
      }
      throw error;
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(window.location.href);
      toast.success(t('room:招待URLをコピーしました'));
    } catch {
      toast.error(t('room:招待URLのコピーに失敗しました'));
    }
  };

  const columnProps = {
    selectedItemId: selectedItem?.id,
    onDeleteItem: (id: string) => void deleteItem(id),
    onCardClick: (item: KptItem) => setSelectedItem(item),
    onTagClick: (tag: string) => setFilterTag(tag),
    onMemberClick: (memberId: string) => setFilterMemberId(memberId),
    onVote: (itemId: string) => toggleVote(itemId),
    totalMemberCount: members.length,
  };

  return (
    <>
      <title>{boardName ? `${boardName} - Simple KPT` : 'Simple KPT'}</title>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <HeaderActions>
          <Button variant="ghost" size="sm" onClick={() => void handleCopyLink()}>
            <LinkIcon className="h-4 w-4" />
            {t('room:招待URLをコピー')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4" />
            {t('board:エクスポート')}
          </Button>
        </HeaderActions>

        <div className="flex h-full flex-col">
          <section className="mx-auto flex min-h-0 w-full max-w-480 flex-1 flex-col p-8">
            <header className="flex-none">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">{boardName || t('room:ボード情報を受信しています…')}</h1>
                <div className="flex items-center gap-2">
                  <ParticipantList />
                  {/* ルーム時計の同期前に開始すると、他の参加者と開始時刻がずれるため、同期が終わるまで操作できないようにする */}
                  <Timer disabled={!isClockSynced} />
                </div>
              </div>
              {isBoardFull && (
                <p role="alert" className="text-destructive mt-2 text-sm">
                  {t(
                    'room:ボードの容量が上限に達したため、変更を保存・共有できません。エクスポート（再開用ファイル）から新しいボードを作り直してください'
                  )}
                </p>
              )}
              {(peerCount === 0 || hasUnexportedChanges) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {peerCount === 0 && <p className="text-muted-foreground">{t('room:他の参加者を待っています')}</p>}
                  {hasUnexportedChanges && (
                    <button
                      type="button"
                      onClick={() => setExportDialogOpen(true)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded transition-colors hover:underline"
                    >
                      <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                      {t('room:最後のエクスポート後に変更があります')}
                    </button>
                  )}
                </div>
              )}
            </header>

            {(filter.tag || filter.memberId) && (
              <div className="flex-none pt-4">
                <FilterBar
                  filterTag={filter.tag}
                  filterMemberName={filter.memberId ? memberNicknameMap[filter.memberId] || t('ui:不明なメンバー') : null}
                  onRemoveTag={() => setFilterTag(null)}
                  onRemoveMember={() => setFilterMemberId(null)}
                />
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col items-stretch gap-5 overflow-y-auto py-4 lg:flex-row">
              {VALID_COLUMNS.map((column) => (
                <BoardColumn key={column} column={column} items={itemsByColumn[column]} {...columnProps} />
              ))}
            </div>

            <div className="flex-none pt-4">
              <ItemAddForm
                columns={VALID_COLUMNS}
                selectedColumn={newItemColumn}
                onColumnChange={setNewItemColumn}
                onSubmit={handleAddCard}
              />
            </div>
          </section>
        </div>

        {/* ドラッグ中にポインタに追従するカード */}
        <DragOverlay>
          {activeItem ? <KPTCard item={activeItem} onDelete={() => {}} onVote={() => {}} totalMemberCount={members.length} /> : null}
        </DragOverlay>

        {/* カード詳細パネル */}
        <ItemDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />

        {/* エクスポートダイアログ */}
        <ExportDialog
          boardName={boardName}
          items={items}
          isOpen={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={() => room.markExported()}
        />
      </DndContext>
    </>
  );
}
