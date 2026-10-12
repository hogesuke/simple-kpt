/**
 * ルームの同期データ（Yjsの状態）の保存
 *
 * 全員が退出してもボードを続きから再開できるよう、参加したルームのYjsの状態をブラウザのIndexedDBに保存する。
 * 同じ招待URLを開き直した際に保存した状態を復元し、その後に他の参加者と同期する。
 * Yjsは同じ更新を重複して適用しないため、複数の参加者が保存した状態を持ち寄ってもカードは重複しない。
 * また、作成画面の「最近参加したボード」から同じURLで開き直せるよう、招待URLの鍵とボード名も保存する。
 * データは参加者の端末にのみ保存し、サーバーには送信しない。
 */

const DB_NAME = 'simple-kpt';
const DB_VERSION = 1;
const STORE_NAME = 'rooms';

/** 保存したルームを保持する期間（最後に保存してからの日数） */
export const ROOM_RETENTION_DAYS = 30;
/** 保存するルームの最大数（超えた場合は古いものから削除する） */
export const MAX_STORED_ROOMS = 20;

export interface StoredRoom {
  roomId: string;
  /** 招待URLの#以降の鍵 */
  secret: string;
  boardName: string;
  state: Uint8Array;
  updatedAt: number;
}

/** 最近参加したボードの一覧に表示する情報 */
export type StoredRoomSummary = Omit<StoredRoom, 'state'>;

/**
 * 削除すべきルームを選ぶ（保持期間を過ぎたもの、および最大数を超えた古いもの）
 */
export function selectRoomsToPrune(rooms: Pick<StoredRoom, 'roomId' | 'updatedAt'>[], now: number): string[] {
  const retentionMs = ROOM_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const sorted = [...rooms].sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted.filter((room, index) => now - room.updatedAt > retentionMs || index >= MAX_STORED_ROOMS).map((room) => room.roomId);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'roomId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let databasePromise: Promise<IDBDatabase> | null = null;

/**
 * IndexedDBへの接続を取得する
 * 接続を1つにまとめることで、トランザクションが呼び出し順に処理され、連続する保存で古い状態が新しい状態を上書きしないようにする
 */
function getDatabase(): Promise<IDBDatabase> {
  databasePromise ??= openDatabase().then(
    (db) => {
      // 別のタブでデータベースの更新が必要になった場合は接続を閉じ、次回の操作で接続し直す
      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };
      db.onclose = () => {
        databasePromise = null;
      };
      return db;
    },
    (error: unknown) => {
      databasePromise = null;
      throw error;
    }
  );
  return databasePromise;
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await getDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * 保存したルームの状態を読み込む（保存されていない場合、またはIndexedDBを利用できない場合はnull）
 */
export async function loadRoomState(roomId: string): Promise<Uint8Array | null> {
  try {
    const room = await withStore<StoredRoom | undefined>('readonly', (store) => store.get(roomId));
    return room ? new Uint8Array(room.state) : null;
  } catch {
    return null;
  }
}

/**
 * ルームの状態を保存する
 */
export async function saveRoomState(room: Omit<StoredRoom, 'updatedAt'>, now: number = Date.now()): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.put({ ...room, updatedAt: now } satisfies StoredRoom));
  } catch {
    // プライベートブラウズなどで保存できない場合は、保存なしで動作を継続する
  }
}

/**
 * 保存したルームを新しい順に取得する
 */
export async function listStoredRooms(): Promise<StoredRoomSummary[]> {
  try {
    const rooms = await withStore<StoredRoom[]>('readonly', (store) => store.getAll());
    return rooms
      .filter((room) => typeof room.secret === 'string' && room.secret.length > 0)
      .map(({ roomId, secret, boardName, updatedAt }) => ({ roomId, secret, boardName, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * 保存したルームをこの端末から削除する
 */
export async function deleteStoredRoom(roomId: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(roomId));
}

/**
 * 保持期間を過ぎたルームと、最大数を超えた古いルームを削除する
 * 読み出しと削除を同じトランザクションで行い、読み出した後に保存し直されたルームを誤って削除しないようにする
 * @param excludeRoomIds 削除の対象から外すルーム（開いているルームなど）
 */
export async function pruneStoredRooms(now: number = Date.now(), excludeRoomIds: string[] = []): Promise<void> {
  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const rooms = (request.result as StoredRoom[]).filter((room) => !excludeRoomIds.includes(room.roomId));
        selectRoomsToPrune(rooms, now).forEach((roomId) => store.delete(roomId));
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // 削除できなかった場合は次回に持ち越す
  }
}
