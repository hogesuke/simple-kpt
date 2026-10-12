import { ChevronRight, FileUp, Info, Trash2, X } from 'lucide-react';
import { ChangeEvent, FormEvent, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import {
  BOARD_FILE_MAX_SIZE,
  InvalidBoardFileError,
  listFileParticipants,
  parseBoardFile,
  reassignParticipant,
  type BoardFile,
} from '@/lib/p2p/board-file';
import { getOrCreateUserId, getStoredNickname, normalizeNickname, storeNickname } from '@/lib/p2p/identity';
import { buildRoomPath, generateRoomCredentials, markAsRoomCreator } from '@/lib/p2p/room-link';
import { deleteStoredRoom, listStoredRooms, type StoredRoomSummary } from '@/lib/p2p/room-store';
import { BOARD_NAME_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '@shared/constants';

import type { InitialBoard } from '@/lib/p2p/kpt-doc';

/** ルーム作成画面からボード画面に渡す初期データ */
export interface NewRoomState {
  initialBoard: InitialBoard;
}

type StartMode = 'new' | 'resume';

/** 「ファイル内の自分」の選択で、該当者がいないことを表す値 */
const NOT_IN_FILE = 'not-in-file';

/**
 * ボードを始める画面
 *
 * - 新しく始める: 新しい招待URLでボードを作成する
 * - 続きから始める: 最近参加したボードを同じ招待URLで開く、または再開用ファイルから新しい招待URLのボードを作成する
 */
export function NewRoom(): ReactElement {
  const { t } = useTranslation('room');
  const navigate = useNavigate();
  const [mode, setMode] = useState<StartMode>('new');

  // ボードの作成（新規・ファイルからの作成で共通）
  const createRoom = useCallback(
    (initialBoard: InitialBoard, nickname: string) => {
      storeNickname(nickname);
      const credentials = generateRoomCredentials();
      markAsRoomCreator(credentials.roomId);

      const state: NewRoomState = { initialBoard };
      navigate(buildRoomPath(credentials), { state });
    },
    [navigate]
  );

  return (
    <>
      <title>{t('ボードを始める - Simple KPT')}</title>
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
        <h1 className="text-2xl font-semibold">{t('ボードを始める')}</h1>

        <Tabs value={mode} onValueChange={(value) => setMode(value as StartMode)}>
          <div className="border-border mb-6 border-b">
            <TabsList>
              <TabsTrigger value="new">{t('新しく始める')}</TabsTrigger>
              <TabsTrigger value="resume">{t('続きから始める')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new" className="flex flex-col gap-5">
            <p className="text-muted-foreground text-sm">
              {t('ボードの内容はサーバーに保存されず、参加者の端末にのみ保存されます。記録として残す場合はエクスポートしてください。')}
            </p>
            <NewBoardForm onCreate={createRoom} />
          </TabsContent>

          <TabsContent value="resume" className="flex flex-col gap-6">
            <RecentBoards />
            <ResumeFromFile onCreate={createRoom} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}

interface CreateFormProps {
  onCreate: (initialBoard: InitialBoard, nickname: string) => void;
}

/**
 * 新しく始める
 */
function NewBoardForm({ onCreate }: CreateFormProps): ReactElement {
  const { t } = useTranslation('room');
  const [boardName, setBoardName] = useState('');
  const [nickname, setNickname] = useState(() => getStoredNickname() ?? '');

  const trimmedBoardName = boardName.trim();
  const normalizedNickname = normalizeNickname(nickname);
  const isValid = trimmedBoardName.length > 0 && normalizedNickname.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    onCreate({ name: trimmedBoardName, items: [] }, normalizedNickname);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="board-name">{t('ボード名')}</Label>
        <Input
          className="bg-card"
          id="board-name"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          maxLength={BOARD_NAME_MAX_LENGTH}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nickname">{t('ニックネーム')}</Label>
        <Input
          className="bg-card"
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX_LENGTH}
          required
        />
      </div>
      <Button className="mt-2 h-11" type="submit" disabled={!isValid}>
        {t('作成する')}
      </Button>
    </form>
  );
}

/**
 * 最近参加したボード（この端末に保存されているボードを、同じ招待URLで開く）
 */
function RecentBoards(): ReactElement {
  const { t, i18n } = useTranslation('room');
  const [rooms, setRooms] = useState<StoredRoomSummary[] | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<StoredRoomSummary | null>(null);

  const loadRooms = useCallback(() => listStoredRooms().then(setRooms), []);

  useEffect(() => {
    let isCancelled = false;
    void listStoredRooms().then((storedRooms) => {
      if (!isCancelled) setRooms(storedRooms);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteStoredRoom(roomToDelete.roomId);
      toast.success(t('{{name}}をこの端末から削除しました', { name: roomToDelete.boardName }));
    } catch {
      toast.error(t('削除に失敗しました'));
    }
    setRoomToDelete(null);
    await loadRooms();
  };

  const formatUpdatedAt = (updatedAt: number) =>
    new Date(updatedAt).toLocaleString(i18n.language, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="flex flex-col gap-3" aria-labelledby="recent-boards-heading">
      <div className="flex items-center gap-1">
        <h2 id="recent-boards-heading" className="text-[15px] font-bold">
          {t('最近参加したボード')}
        </h2>
        {/* 共用の端末での注意（招待URLの鍵とボードの内容が端末に残るため） */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 w-7 p-0"
              aria-label={t('最近参加したボードについて')}
            >
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-2 text-xs leading-relaxed">
            <p>{t('ボードを選ぶと、前と同じURLで開きます。参加者に共有し直す必要はありません。')}</p>
            <p>
              {t(
                '最近参加したボードは、招待URLとボードの内容がこの端末のブラウザに保存されています。共用のパソコンを使っている場合は、使い終わったら削除してください。'
              )}
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {rooms !== null && rooms.length === 0 && (
        <p className="text-muted-foreground border-border rounded-md border border-dashed px-4 py-6 text-center text-sm">
          {t('この端末で参加したボードはまだありません。')}
        </p>
      )}

      {rooms !== null && rooms.length > 0 && (
        <ul
          className="border-border divide-border-subtle bg-card divide-y overflow-hidden rounded-md border"
          aria-label={t('最近参加したボード')}
        >
          {rooms.map((room) => (
            <li key={room.roomId} className="flex items-center">
              {/* 行全体（ボード名〜日時）を、前と同じ招待URLで開くリンクにする */}
              <Link
                to={buildRoomPath(room)}
                aria-label={t('{{name}}を開く', { name: room.boardName })}
                className="group hover:bg-accent focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 py-3 pr-2 pl-4 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{room.boardName}</span>
                <time
                  className="text-muted-foreground flex-none text-xs tabular-nums"
                  dateTime={new Date(room.updatedAt).toISOString()}
                  title={t('最終更新日時')}
                >
                  {formatUpdatedAt(room.updatedAt)}
                </time>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-foreground h-4 w-4 flex-none transition-colors"
                  aria-hidden="true"
                />
              </Link>
              {/* 削除はリンクの範囲外に置き、誤操作を防ぐ */}
              <div className="border-border-subtle flex-none self-stretch border-l px-1.5 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full"
                  onClick={() => setRoomToDelete(room)}
                  aria-label={t('{{name}}をこの端末から削除', { name: room.boardName })}
                  title={t('この端末から削除')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={roomToDelete !== null} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t('この端末から削除しますか？')}</DialogTitle>
            <DialogDescription className="text-[13.5px]">
              {t('「{{name}}」の招待URLと内容をこの端末から削除します。ほかの参加者の端末に保存されている内容は削除されません。', {
                name: roomToDelete?.boardName,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="h-11" variant="outline" onClick={() => setRoomToDelete(null)}>
              {t('キャンセル')}
            </Button>
            <Button className="h-11" variant="destructive" onClick={() => void handleDelete()}>
              {t('削除する')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/**
 * 再開用ファイルから、新しい招待URLのボードを作成する
 */
function ResumeFromFile({ onCreate }: CreateFormProps): ReactElement {
  const { t } = useTranslation('room');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{ fileName: string; file: BoardFile } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [boardName, setBoardName] = useState('');
  const [nickname, setNickname] = useState(() => getStoredNickname() ?? '');
  // ファイル内の人のうち、自分として引き継ぐ人のユーザーID
  const [selfUserId, setSelfUserId] = useState<string>(NOT_IN_FILE);
  const [myUserId] = useState(() => getOrCreateUserId());

  const trimmedBoardName = boardName.trim();
  const normalizedNickname = normalizeNickname(nickname);
  const isValid = selected !== null && trimmedBoardName.length > 0 && normalizedNickname.length > 0;

  // ファイル内に今の端末のユーザーIDがない場合（別の端末で書き出したファイルの場合）のみ、ファイル内の自分を選んでもらう
  const fileParticipants = useMemo(() => {
    if (!selected) return [];
    const participants = listFileParticipants(selected.file.items);
    return participants.some((participant) => participant.userId === myUserId) ? [] : participants;
  }, [selected, myUserId]);

  const handleSelfChange = (userId: string) => {
    setSelfUserId(userId);
    // ニックネームが未入力の場合は、選んだ人の名前を入れておく
    const participant = fileParticipants.find((p) => p.userId === userId);
    if (participant && !normalizedNickname) setNickname(participant.nickname);
  };

  const clearSelection = () => {
    setSelfUserId(NOT_IN_FILE);
    setSelected(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // 読み込みに失敗した場合に、修正した同じファイルを選び直しても変更が検知されるよう、選択をリセットしておく
    event.target.value = '';

    if (selectedFile.size > BOARD_FILE_MAX_SIZE) {
      setSelected(null);
      setFileError(t('ファイルサイズが大きすぎます'));
      return;
    }

    try {
      const file = parseBoardFile(await selectedFile.text());
      setSelected({ fileName: selectedFile.name, file });
      setSelfUserId(NOT_IN_FILE);
      setBoardName(file.board.name);
      setFileError(null);
    } catch (error) {
      setSelected(null);
      setFileError(
        error instanceof InvalidBoardFileError
          ? t('Simple KPTのボードファイルとして読み込めませんでした')
          : t('ファイルの読み込みに失敗しました')
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    // ファイル内の自分を選んだ場合は、その人のカード・担当・投票をこの端末のユーザーとして引き継ぐ
    const items = selfUserId === NOT_IN_FILE ? selected.file.items : reassignParticipant(selected.file.items, selfUserId, myUserId);
    onCreate({ name: trimmedBoardName, items }, normalizedNickname);
  };

  return (
    <section className="flex flex-col gap-3" aria-label={t('再開用ファイルから始める')}>
      <input
        ref={fileInputRef}
        id="board-file"
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => void handleFileChange(e)}
      />

      {selected ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">{t('新しいURLのボードとして作成します。作成後、参加者に共有し直してください。')}</p>
          <div className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="truncate">
              {selected.fileName}
              <span className="text-muted-foreground ml-2">{t('{{count}}件のカード', { count: selected.file.items.length })}</span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={clearSelection} aria-label={t('選択を解除')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-board-name">{t('ボード名')}</Label>
            <Input
              className="bg-card"
              id="resume-board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              maxLength={BOARD_NAME_MAX_LENGTH}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-nickname">{t('ニックネーム')}</Label>
            <Input
              className="bg-card"
              id="resume-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX_LENGTH}
              required
            />
          </div>
          {fileParticipants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('このファイルの中で、あなたはどれですか？（任意）')}</legend>
              <p className="text-muted-foreground text-xs">{t('選んだ人のカード・担当・投票を、あなたのものとして引き継ぎます。')}</p>
              <RadioGroup value={selfUserId} onValueChange={handleSelfChange} className="flex flex-wrap gap-2 pt-1">
                {[...fileParticipants, { userId: NOT_IN_FILE, nickname: t('この中にいない') }].map((participant) => (
                  <Label
                    key={participant.userId}
                    htmlFor={`self-${participant.userId}`}
                    className={`has-focus-visible:ring-ring bg-card cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-normal transition-colors has-focus-visible:ring-2 ${
                      selfUserId === participant.userId ? 'border-primary text-primary font-bold' : 'border-border hover:border-input'
                    }`}
                  >
                    <RadioGroupItem value={participant.userId} id={`self-${participant.userId}`} className="sr-only" />
                    {participant.nickname}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
          )}
          <Button className="mt-2 h-11" type="submit" disabled={!isValid}>
            {t('このファイルから作成する')}
          </Button>
        </form>
      ) : (
        <>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            {t('再開用ファイル（JSON）から始める')}
          </Button>
          {fileError && (
            <p className="text-destructive text-sm" role="alert">
              {fileError}
            </p>
          )}
        </>
      )}
    </section>
  );
}
