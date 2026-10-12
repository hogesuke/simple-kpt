import { z } from 'zod';

import { BOARD_NAME_MAX_LENGTH, ITEM_TEXT_MAX_LENGTH, MAX_ITEMS_PER_BOARD, VALID_COLUMNS, VALID_TRY_STATUSES } from '@shared/constants';

import type { KptItem } from '@/types/kpt';

// CSP(script-src 'self')環境でZod v4のJITコンパイル(new Function)によるCSP違反を防止
// https://github.com/colinhacks/zod/issues/4273
z.config({ jitless: true });

/**
 * ボードファイル（JSON）
 *
 * ボードを保存・再開するためのファイル形式。ルーム作成時のみ読み込める。
 * 形式を変更する場合はBOARD_FILE_VERSIONを上げ、古い形式の読み込みに対応すること。
 */

export const BOARD_FILE_FORMAT = 'simple-kpt-board';
export const BOARD_FILE_VERSION = 1;

/** 読み込めるファイルの最大サイズ（bytes） */
export const BOARD_FILE_MAX_SIZE = 1024 * 1024;

/** ユーザーIDやニックネームとして受け付ける最大文字数（他の参加者が付けた値も含むため緩めに制限する） */
const ID_MAX_LENGTH = 64;
const NAME_MAX_LENGTH = 64;

const nullableString = (max: number) => z.string().max(max).nullable().default(null);

const voterSchema = z.object({
  userId: z.string().min(1).max(ID_MAX_LENGTH),
  nickname: z.string().max(NAME_MAX_LENGTH),
});

const boardFileItemSchema = z.object({
  column: z.enum(VALID_COLUMNS),
  text: z.string().min(1).max(ITEM_TEXT_MAX_LENGTH),
  position: z.number(),
  authorId: nullableString(ID_MAX_LENGTH),
  authorNickname: nullableString(NAME_MAX_LENGTH),
  createdAt: z.iso.datetime({ offset: true }).nullable().default(null),
  updatedAt: z.iso.datetime({ offset: true }).nullable().default(null),
  status: z.enum(VALID_TRY_STATUSES).nullable().default(null),
  assigneeId: nullableString(ID_MAX_LENGTH),
  assigneeNickname: nullableString(NAME_MAX_LENGTH),
  dueDate: z.iso.date().nullable().default(null),
  voters: z.array(voterSchema).max(MAX_ITEMS_PER_BOARD).default([]),
});

const boardFileSchema = z.object({
  format: z.literal(BOARD_FILE_FORMAT),
  version: z.literal(BOARD_FILE_VERSION),
  exportedAt: z.string(),
  board: z.object({
    name: z.string().trim().min(1).max(BOARD_NAME_MAX_LENGTH),
  }),
  items: z.array(boardFileItemSchema).max(MAX_ITEMS_PER_BOARD),
});

export type BoardFile = z.infer<typeof boardFileSchema>;
export type BoardFileItem = BoardFile['items'][number];

/**
 * ボードの内容からボードファイルを生成する
 */
export function createBoardFile(boardName: string, items: KptItem[], exportedAt: Date = new Date()): BoardFile {
  return {
    format: BOARD_FILE_FORMAT,
    version: BOARD_FILE_VERSION,
    exportedAt: exportedAt.toISOString(),
    board: { name: boardName },
    items: items.map((item) => ({
      column: item.column,
      text: item.text,
      position: item.position,
      authorId: item.authorId ?? null,
      authorNickname: item.authorNickname ?? null,
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
      status: item.status ?? null,
      assigneeId: item.assigneeId ?? null,
      assigneeNickname: item.assigneeNickname ?? null,
      dueDate: item.dueDate ?? null,
      voters: (item.voters ?? []).map((voter) => ({ userId: voter.id, nickname: voter.nickname ?? '' })),
    })),
  };
}

export function serializeBoardFile(file: BoardFile): string {
  return JSON.stringify(file, null, 2);
}

export class InvalidBoardFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBoardFileError';
  }
}

/**
 * ボードファイルの文字列を検証して読み込む
 * 外部から渡されるファイルのため、形式・文字数・件数をすべて検証する
 */
export function parseBoardFile(content: string): BoardFile {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new InvalidBoardFileError('JSONとして読み込めません');
  }

  const result = boardFileSchema.safeParse(json);
  if (!result.success) {
    throw new InvalidBoardFileError(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n'));
  }
  return result.data;
}

/** ボードファイルに登場する人（作成者・担当者・投票者） */
export interface BoardFileParticipant {
  userId: string;
  nickname: string;
}

/**
 * ボードファイルに登場する人の一覧を取得する（同じユーザーIDは1人にまとめる）
 */
export function listFileParticipants(items: BoardFileItem[]): BoardFileParticipant[] {
  const participants = new Map<string, string>();
  const add = (userId: string | null, nickname: string | null) => {
    if (!userId || participants.has(userId)) return;
    participants.set(userId, nickname?.trim() || userId);
  };

  for (const item of items) {
    add(item.authorId, item.authorNickname);
    add(item.assigneeId, item.assigneeNickname);
    item.voters.forEach((voter) => add(voter.userId, voter.nickname));
  }

  return [...participants].map(([userId, nickname]) => ({ userId, nickname }));
}

/**
 * ファイル内の指定した人を、別のユーザーIDに付け替える
 * 別の端末で再開用ファイルから始める際に、ファイル内の自分のカード・担当・投票をこの端末のユーザーとして引き継ぐために用いる
 */
export function reassignParticipant(items: BoardFileItem[], fromUserId: string, toUserId: string): BoardFileItem[] {
  return items.map((item) => ({
    ...item,
    authorId: item.authorId === fromUserId ? toUserId : item.authorId,
    assigneeId: item.assigneeId === fromUserId ? toUserId : item.assigneeId,
    voters: item.voters.map((voter) => (voter.userId === fromUserId ? { ...voter, userId: toUserId } : voter)),
  }));
}
