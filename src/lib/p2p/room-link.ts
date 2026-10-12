/**
 * ルームのURL
 *
 * `/r/<roomId>#<secret>`の形式とする。
 * secretは接続情報の暗号化に用いる鍵で、URLの#以降に置くことでホスティングサーバーに送信されないようにする。
 */

const ROOM_CREATOR_STORAGE_KEY_PREFIX = 'simple-kpt:room-creator:';

function generateRandomToken(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface RoomCredentials {
  roomId: string;
  secret: string;
}

export function generateRoomCredentials(): RoomCredentials {
  return {
    roomId: generateRandomToken(16),
    secret: generateRandomToken(16),
  };
}

export function buildRoomPath({ roomId, secret }: RoomCredentials): string {
  return `/r/${roomId}#${secret}`;
}

/**
 * URLのハッシュ（#以降）からsecretを取り出す
 */
export function parseSecretFromHash(hash: string): string | null {
  const secret = hash.replace(/^#/, '');
  return /^[A-Za-z0-9_-]{16,}$/.test(secret) ? secret : null;
}

/**
 * このタブがルーム作成者であることを記録する
 * sessionStorageに保存するため、作成者がリロードしても作成者として扱われる
 */
export function markAsRoomCreator(roomId: string): void {
  try {
    sessionStorage.setItem(`${ROOM_CREATOR_STORAGE_KEY_PREFIX}${roomId}`, '1');
  } catch {
    // 保存できない場合は作成者として扱われないだけで、動作に支障はない
  }
}

export function isRoomCreator(roomId: string): boolean {
  try {
    return sessionStorage.getItem(`${ROOM_CREATOR_STORAGE_KEY_PREFIX}${roomId}`) === '1';
  } catch {
    return false;
  }
}
