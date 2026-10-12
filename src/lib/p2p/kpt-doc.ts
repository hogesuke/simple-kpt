import * as Y from 'yjs';

import { BOARD_NAME_MAX_LENGTH, ITEM_TEXT_MAX_LENGTH, MAX_ITEMS_PER_BOARD, VALID_COLUMNS, VALID_TRY_STATUSES } from '@shared/constants';

import type { BoardFileItem } from '@/lib/p2p/board-file';
import type { KptColumnType, KptItem, TryStatus, Voter } from '@/types/kpt';

/**
 * KPTボードのY.Docの構造
 *
 * - meta: Y.Map … ボード名（name）、作成日時（createdAt）、タイマー（timer）
 * - items: Y.Map<Y.Map> … アイテムIDごとに項目単位のY.Mapを持つ（別項目の同時編集が消えないようにするため）
 * - votes: Y.Map … `${itemId}:${userId}`をキーとした投票（同時投票で衝突しないようにするため）
 */

/** Y.Docに保存するタイマー（開始時刻はルーム時刻） */
export interface DocTimer {
  startedAtRoomTime: number;
  durationSeconds: number;
  hideOthersCards: boolean;
  startedBy: string;
}

interface DocVote {
  itemId: string;
  userId: string;
  nickname: string;
}

/** Y.Docから読み出したボードの状態 */
export interface KptDocSnapshot {
  name: string;
  createdAt: string | null;
  items: KptItem[];
  timer: DocTimer | null;
}

/** アイテムのうちY.Docに保存する項目 */
const ITEM_FIELDS = [
  'column',
  'text',
  'position',
  'authorId',
  'authorNickname',
  'createdAt',
  'updatedAt',
  'status',
  'assigneeId',
  'assigneeNickname',
  'dueDate',
] as const satisfies readonly (keyof KptItem)[];

export class ItemLimitExceededError extends Error {
  constructor() {
    super(`アイテムは${MAX_ITEMS_PER_BOARD}個までです`);
    this.name = 'ItemLimitExceededError';
  }
}

function getMeta(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('meta');
}

function getItems(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('items');
}

function getVotes(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('votes');
}

/*
 * 他の参加者から届くデータの検証
 *
 * Y.Docには、招待URLを知っている参加者なら誰でも任意の値を書き込める。
 * 細工されたデータで画面が落ちたり固まったりしないよう、読み出す値はすべて型と範囲を検証し、不正な値は無視する。
 */

/** ユーザーIDとして受け付ける最大文字数 */
const ID_MAX_LENGTH = 64;
/** ニックネームとして受け付ける最大文字数（他の参加者の値も含むため、入力の上限より緩めにする） */
const NAME_MAX_LENGTH = 64;
/** タイマーとして受け付ける最大秒数 */
const TIMER_MAX_SECONDS = 24 * 60 * 60;
/** タイマーの開始時刻として受け付ける範囲（日時に変換できない極端な値で画面が落ちないようにする） */
const TIMER_MIN_STARTED_AT = Date.UTC(2020, 0, 1);
const TIMER_MAX_STARTED_AT = Date.UTC(2100, 0, 1);

/**
 * ボード全体（Y.Docの全状態）の最大サイズ（bytes）
 * 他の参加者から大量のデータを書き込まれても、読み出しの計算量や参加時の同期データが膨らみすぎないよう、これを超える更新は受け付けない
 * （カード200件の通常の利用では数百KB程度に収まる）
 */
export const MAX_DOC_BYTES = 2 * 1024 * 1024;

function readString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' ? value.slice(0, maxLength) : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readDateTime(value: unknown): string | undefined {
  const text = readString(value, 64);
  return text !== null && Number.isFinite(Date.parse(text)) ? text : undefined;
}

function isItemMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map;
}

function readVote(value: unknown): DocVote | null {
  if (typeof value !== 'object' || value === null) return null;
  const { itemId, userId, nickname } = value as Record<string, unknown>;
  const validItemId = readString(itemId, ID_MAX_LENGTH);
  const validUserId = readString(userId, ID_MAX_LENGTH);
  if (!validItemId || !validUserId) return null;
  return { itemId: validItemId, userId: validUserId, nickname: readString(nickname, NAME_MAX_LENGTH) ?? '' };
}

function readTimer(value: unknown): DocTimer | null {
  if (typeof value !== 'object' || value === null) return null;
  const { startedAtRoomTime, durationSeconds, hideOthersCards, startedBy } = value as Record<string, unknown>;
  const validStartedAt = readFiniteNumber(startedAtRoomTime);
  const validDuration = readFiniteNumber(durationSeconds);
  if (validStartedAt === null || validStartedAt < TIMER_MIN_STARTED_AT || validStartedAt > TIMER_MAX_STARTED_AT) return null;
  if (validDuration === null || validDuration <= 0 || validDuration > TIMER_MAX_SECONDS) return null;
  return {
    startedAtRoomTime: validStartedAt,
    durationSeconds: validDuration,
    hideOthersCards: hideOthersCards === true,
    startedBy: readString(startedBy, ID_MAX_LENGTH) ?? '',
  };
}

function readColumn(value: unknown): KptColumnType | null {
  return (VALID_COLUMNS as readonly unknown[]).includes(value) ? (value as KptColumnType) : null;
}

function readStatus(value: unknown): TryStatus | null {
  return (VALID_TRY_STATUSES as readonly unknown[]).includes(value) ? (value as TryStatus) : null;
}

function readDueDate(value: unknown): string | null {
  const text = readString(value, 10);
  if (text === null || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  // 2026-13-45のような実在しない日付は、日付に変換して書式を戻したときに一致しない
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
}

/**
 * 有効なアイテム（画面に表示されるアイテム）か
 */
function isValidItem(value: unknown): value is Y.Map<unknown> {
  return isItemMap(value) && readColumn(value.get('column')) !== null;
}

function voteKey(itemId: string, userId: string): string {
  return `${itemId}:${userId}`;
}

export interface InitialBoard {
  name: string;
  /** ボードファイルから作成する場合のアイテム */
  items?: BoardFileItem[];
}

/**
 * ボードを初期化する（ルーム作成者のみが、ルーム作成時に1回だけ行う）
 */
export function initializeBoard(doc: Y.Doc, { name, items = [] }: InitialBoard): void {
  const meta = getMeta(doc);
  if (meta.has('name')) return;

  const itemsMap = getItems(doc);
  const votes = getVotes(doc);

  doc.transact(() => {
    meta.set('name', name);
    meta.set('createdAt', new Date().toISOString());
    meta.set('timer', null);

    // 再開用ファイルの位置は0以下や重複を含みうるため、並び順を保ったままカラムごとに1000刻みで振り直す
    const positionsInColumn = new Map<string, number>();
    const sortedItems = [...items.slice(0, MAX_ITEMS_PER_BOARD)].sort((a, b) => a.position - b.position);

    for (const { voters, ...item } of sortedItems) {
      const id = crypto.randomUUID();
      const itemMap = new Y.Map<unknown>();
      itemsMap.set(id, itemMap);
      const position = (positionsInColumn.get(item.column) ?? 0) + 1000;
      positionsInColumn.set(item.column, position);
      for (const field of ITEM_FIELDS) {
        itemMap.set(field, field === 'position' ? position : (item[field] ?? null));
      }

      for (const voter of voters) {
        votes.set(voteKey(id, voter.userId), { itemId: id, userId: voter.userId, nickname: voter.nickname });
      }
    }
  });
}

export interface AddItemParams {
  column: KptColumnType;
  text: string;
  authorId: string;
  authorNickname: string;
}

/**
 * アイテムを追加する
 */
export function addItem(doc: Y.Doc, { column, text, authorId, authorNickname }: AddItemParams): string {
  const items = getItems(doc);
  // 表示されない不正なエントリを大量に書き込まれても追加できなくならないよう、有効なアイテムだけを数える
  const validItemCount = [...items.values()].filter(isValidItem).length;
  if (validItemCount >= MAX_ITEMS_PER_BOARD) {
    throw new ItemLimitExceededError();
  }

  const positions = [...items.values()]
    .filter((item) => isItemMap(item) && item.get('column') === column)
    .map((item) => readFiniteNumber((item as Y.Map<unknown>).get('position')) ?? 0);
  const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;

  const id = crypto.randomUUID();
  const itemMap = new Y.Map<unknown>();

  doc.transact(() => {
    items.set(id, itemMap);
    itemMap.set('column', column);
    itemMap.set('text', text);
    // 複数人が同時に追加しても位置が重ならないよう、わずかなランダムな幅を加える
    itemMap.set('position', maxPosition + 1000 + Math.random());
    itemMap.set('authorId', authorId);
    itemMap.set('authorNickname', authorNickname);
    itemMap.set('createdAt', new Date().toISOString());
    itemMap.set('status', column === 'try' ? 'pending' : null);
  });

  return id;
}

/**
 * アイテムを更新する
 * 変更のあった項目のみを書き込むことで、他の参加者による別項目の同時編集を上書きしない
 */
export function updateItem(doc: Y.Doc, item: KptItem): void {
  const itemMap = getItems(doc).get(item.id);
  if (!isItemMap(itemMap)) return;

  doc.transact(() => {
    let changed = false;
    for (const field of ITEM_FIELDS) {
      if (field === 'createdAt' || field === 'updatedAt') continue;
      const value = item[field] ?? null;
      if (itemMap.get(field) !== value) {
        itemMap.set(field, value);
        changed = true;
      }
    }
    if (changed) {
      itemMap.set('updatedAt', new Date().toISOString());
    }
  });
}

export interface MoveItemParams {
  column: KptColumnType;
  position: number;
}

/**
 * 同時に同じ位置へ移動しても位置が重ならないよう、前後のアイテムとの間隔の範囲でわずかなランダムな幅を加える
 */
function jitterPosition(position: number, otherPositions: number[]): number {
  const lower = Math.max(...otherPositions.filter((p) => p < position), position - 1000);
  const upper = Math.min(...otherPositions.filter((p) => p > position), position + 1000);
  // 同じ位置のアイテムがある場合は、そのアイテムと次のアイテムの間に置く
  if (otherPositions.includes(position)) {
    return position + (upper - position) * (0.25 + Math.random() * 0.5);
  }
  const gap = Math.min(position - lower, upper - position);
  return position + (Math.random() - 0.5) * gap * 0.1;
}

/**
 * アイテムを移動する（ドラッグ＆ドロップ）
 * 移動に関わる項目（カラム・位置・Tryに移動した場合のステータス）だけを書き込み、
 * ドラッグ中に他の参加者が行った別の項目の編集を、ドラッグ開始時の古い値で上書きしないようにする
 */
export function moveItem(doc: Y.Doc, itemId: string, { column, position }: MoveItemParams): void {
  const itemMap = getItems(doc).get(itemId);
  if (!isItemMap(itemMap)) return;

  const otherPositions = [...getItems(doc).entries()]
    .filter(([id, other]) => id !== itemId && isItemMap(other) && other.get('column') === column)
    .map(([, other]) => readFiniteNumber((other as Y.Map<unknown>).get('position')) ?? 0);

  doc.transact(() => {
    itemMap.set('column', column);
    itemMap.set('position', jitterPosition(position, otherPositions));
    // Tryに移動した場合、ステータスが未設定なら未対応にする
    if (column === 'try' && !readStatus(itemMap.get('status'))) {
      itemMap.set('status', 'pending');
    }
    itemMap.set('updatedAt', new Date().toISOString());
  });
}

/**
 * アイテムを削除する（アイテムへの投票も削除する）
 */
export function deleteItem(doc: Y.Doc, itemId: string): void {
  const votes = getVotes(doc);
  const items = getItems(doc);

  doc.transact(() => {
    items.delete(itemId);
    // 不正なエントリも合わせて削除する
    for (const [key, value] of items.entries()) {
      if (!isValidItem(value)) items.delete(key);
    }
    // 削除したアイテムへの投票に加え、存在しないアイテムへの投票や不正な形式の投票も合わせて削除する
    for (const [key, value] of votes.entries()) {
      if (!readValidVote(key, value, items)) votes.delete(key);
    }
  });
}

/**
 * 有効な投票を読み出す（不正な形式、キーと内容の不一致、存在しないアイテムへの投票はnull）
 */
function readValidVote(key: string, value: unknown, items: Y.Map<unknown>): DocVote | null {
  const vote = readVote(value);
  if (!vote || key !== voteKey(vote.itemId, vote.userId)) return null;
  return isValidItem(items.get(vote.itemId)) ? vote : null;
}

/**
 * ボード名を読み出す（不正な値の場合は空文字）
 */
export function readBoardName(doc: Y.Doc): string {
  return readString(getMeta(doc).get('name'), BOARD_NAME_MAX_LENGTH) ?? '';
}

/**
 * 投票を切り替える
 */
export function toggleVote(doc: Y.Doc, itemId: string, userId: string, nickname: string): void {
  if (!getItems(doc).has(itemId)) return;

  const votes = getVotes(doc);
  const key = voteKey(itemId, userId);

  // 有効な投票がある場合は取り消す。不正な値が入っている場合は、投票していないものとして投票で上書きする
  if (readValidVote(key, votes.get(key), getItems(doc))) {
    votes.delete(key);
  } else {
    votes.set(key, { itemId, userId, nickname });
  }
}

/**
 * 参加者のニックネームを変更する
 * 自分が作成したカードの作成者名、自分が担当者のTryの担当者名、自分の投票の表示名をまとめて書き換える
 * （カードの内容の変更ではないため、更新日時は変えない）
 */
export function renameParticipant(doc: Y.Doc, userId: string, nickname: string): void {
  const votes = getVotes(doc);

  doc.transact(() => {
    for (const itemMap of getItems(doc).values()) {
      if (!isItemMap(itemMap)) continue;
      if (itemMap.get('authorId') === userId && itemMap.get('authorNickname') !== nickname) {
        itemMap.set('authorNickname', nickname);
      }
      if (itemMap.get('assigneeId') === userId && itemMap.get('assigneeNickname') !== nickname) {
        itemMap.set('assigneeNickname', nickname);
      }
    }
    for (const [key, value] of votes.entries()) {
      const vote = readVote(value);
      if (vote && vote.userId === userId && vote.nickname !== nickname) {
        votes.set(key, { ...vote, nickname });
      }
    }
  });
}

/**
 * タイマーを設定する（nullで停止）
 */
export function setTimer(doc: Y.Doc, timer: DocTimer | null): void {
  getMeta(doc).set('timer', timer);
}

/**
 * Y.Docからボードの状態を読み出す
 * @param currentUserId hasVotedの判定に用いる自分のユーザーID
 */
export function readSnapshot(doc: Y.Doc, currentUserId: string): KptDocSnapshot {
  const meta = getMeta(doc);

  const itemMaps = getItems(doc);

  // 投票はキーが「アイテムID:ユーザーID」と一致し、存在するアイテムへのものだけを数える（キーが一意なので同じ人の投票は1票になる）
  // エントリの件数はボード全体のサイズの上限（MAX_DOC_BYTES）で抑えられている
  const votersByItemId = new Map<string, Voter[]>();
  for (const [key, value] of getVotes(doc).entries()) {
    const vote = readValidVote(key, value, itemMaps);
    if (!vote) continue;
    const voters = votersByItemId.get(vote.itemId) ?? [];
    voters.push({ id: vote.userId, nickname: vote.nickname });
    votersByItemId.set(vote.itemId, voters);
  }

  const items: KptItem[] = [];
  for (const [id, itemMap] of itemMaps.entries()) {
    if (!isItemMap(itemMap)) continue;
    // 他の参加者からの更新が途中までしか届いていない場合や、不正な値の場合はスキップ
    const column = readColumn(itemMap.get('column'));
    if (!column) continue;

    const voters = votersByItemId.get(id) ?? [];
    items.push({
      id,
      boardId: doc.guid,
      column,
      text: readString(itemMap.get('text'), ITEM_TEXT_MAX_LENGTH) ?? '',
      position: readFiniteNumber(itemMap.get('position')) ?? 0,
      authorId: readString(itemMap.get('authorId'), ID_MAX_LENGTH),
      authorNickname: readString(itemMap.get('authorNickname'), NAME_MAX_LENGTH),
      createdAt: readDateTime(itemMap.get('createdAt')),
      updatedAt: readDateTime(itemMap.get('updatedAt')),
      status: readStatus(itemMap.get('status')),
      assigneeId: readString(itemMap.get('assigneeId'), ID_MAX_LENGTH),
      assigneeNickname: readString(itemMap.get('assigneeNickname'), NAME_MAX_LENGTH),
      dueDate: readDueDate(itemMap.get('dueDate')),
      voteCount: voters.length,
      hasVoted: voters.some((v) => v.id === currentUserId),
      voters,
    });
  }

  items.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  return {
    name: readBoardName(doc),
    createdAt: readDateTime(meta.get('createdAt')) ?? null,
    // 上限を超えるアイテムが書き込まれても、画面が固まらないよう上限までに限る
    items: items.slice(0, MAX_ITEMS_PER_BOARD),
    timer: readTimer(meta.get('timer')),
  };
}
