import { NICKNAME_MAX_LENGTH } from '@shared/constants';

/**
 * アカウントを持たない参加者の識別情報
 * ユーザーIDとニックネームはブラウザのlocalStorageに保存する
 */

const USER_ID_STORAGE_KEY = 'simple-kpt:user-id';
const NICKNAME_STORAGE_KEY = 'simple-kpt:nickname';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // プライベートブラウズなどで保存できない場合は、このタブの間だけ有効とする
  }
}

let fallbackUserId: string | null = null;

/**
 * 自分のユーザーIDを取得する（未発行の場合は発行する）
 */
export function getOrCreateUserId(): string {
  const stored = readStorage(USER_ID_STORAGE_KEY);
  if (stored) return stored;

  fallbackUserId ??= crypto.randomUUID();
  writeStorage(USER_ID_STORAGE_KEY, fallbackUserId);
  return fallbackUserId;
}

export function getStoredNickname(): string | null {
  return readStorage(NICKNAME_STORAGE_KEY);
}

export function storeNickname(nickname: string): void {
  writeStorage(NICKNAME_STORAGE_KEY, nickname);
}

/**
 * ニックネームを正規化する（前後の空白を除去し、最大文字数で切り詰める）
 */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().slice(0, NICKNAME_MAX_LENGTH);
}
