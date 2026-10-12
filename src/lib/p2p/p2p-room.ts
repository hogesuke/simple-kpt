import { selfId } from '@trystero-p2p/core';
import * as Y from 'yjs';

import { normalizeNickname } from '@/lib/p2p/identity';
import { MAX_DOC_BYTES, readBoardName, readSnapshot, renameParticipant, type DocTimer, type KptDocSnapshot } from '@/lib/p2p/kpt-doc';
import { RoomClock, type ClockSample } from '@/lib/p2p/room-clock';
import { joinRoom } from '@/lib/p2p/signaling';

import type { MessageAction, RequestAction, Room } from '@trystero-p2p/core';

// NOTE: シグナリングには自前のシグナリングサーバー（Cloudflare Workers、signaling/）を用いる。
//       公開サービスを用いる方式は以下の理由で採用しなかった。
//       - Nostr: 端末時刻を基準にメッセージを絞り込むため、端末の時計が10秒程度ずれると接続できなかった
//       - BitTorrentトラッカー: 企業のネットワークで「P2P・ファイル共有」として遮断されるおそれがある
//       - MQTT: 公開ブローカーが443番以外のポートを用いるため、企業のネットワークで遮断されるおそれがある
const APP_ID = 'simple-kpt';

/** 時刻問い合わせの回数（往復が最短の結果を採用する） */
const CLOCK_SAMPLE_COUNT = 5;
const CLOCK_REQUEST_TIMEOUT_MS = 3000;
/** 時刻を回答できる参加者が見つからない場合に、基準となる時計を決め直すまでの待ち時間 */
const CLOCK_FALLBACK_DELAY_MS = 8000;
/** 基準となる時計を決め直した後、基準になった参加者に改めて問い合わせるまでの待ち時間 */
const CLOCK_RETRY_DELAY_MS = 3000;
/** 他の参加者から受け付けるルーム時刻と自分の時計の差の上限（不正な時刻で時計を壊されないようにする） */
const MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

/** 他の参加者から受け付けるエクスポート時刻の、自分のルーム時刻からの未来方向の許容差 */
const MAX_EXPORTED_AT_FUTURE_MS = 60 * 1000;
/** タイマーの開始時刻・残り時間の判定に用いる許容差（参加者間の時計の推定誤差を見込む） */
const TIMER_TOLERANCE_MS = 5000;
/** setTimeoutに指定できる最大の待ち時間（これを超えると即時に実行されるため） */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
/**
 * 自分より小さいIDの参加者が、接続してからこの時間がたってもルーム時刻を回答しない場合は、時計の基準を決める際に考慮しない
 * （時刻に回答しない参加者が最小のIDを名乗って、同期を妨げられないようにする）
 * 正直な参加者なら、この間に自分が基準になるか同期を終えている
 */
const CLOCK_UNRESPONSIVE_PEER_MS = CLOCK_FALLBACK_DELAY_MS + 3 * CLOCK_RETRY_DELAY_MS;
/** 自分の変更を受け付けるボードのサイズの上限（上限に近づいたら変更を止め、参加者ごとに内容が食い違わないようにする） */
const LOCAL_WRITE_LIMIT_BYTES = MAX_DOC_BYTES * 0.9;
/**
 * 依存する更新が届いていないため適用を保留している更新（Yjsのpending）の最大サイズ（bytes）
 * WebRTCでは順序どおりに届くため、通常の通信で大きくなることはない。依存を欠いた更新を送り続けてサイズの上限を回り込まれないようにする
 */
const MAX_PENDING_UPDATE_BYTES = 256 * 1024;
/**
 * 依存する更新が届いていないため適用を保留している削除（YjsのpendingDs）の最大サイズ（bytes）
 * 保留中の削除は以後の更新を受け取るたびに処理し直されるため、pendingStructsより小さく抑える
 */
const MAX_PENDING_DELETE_BYTES = 16 * 1024;
/**
 * ボード全体のサイズの見積もりで、増えた項目（Yjsのstruct）1つあたりに見込むサイズ（bytes）
 * 削除で項目を細かく分割されると、送られた更新のサイズに比べて全体のサイズが大きく増えるため、項目数の増加分も見積もりに加える
 */
const ESTIMATED_BYTES_PER_STRUCT = 32;
/**
 * ボードに書き込める参加者（YjsのclientID）の最大数
 * 参加者の数に比例する処理（状態ベクトルの計算など）が、受信のたびに重くならないようにする
 * （通常の利用では、ボードを開くたびに1つずつしか増えない）
 */
const MAX_DOC_CLIENTS = 5000;
/**
 * 自分の変更を受け付けるボードの参加者（YjsのclientID）の数の上限
 * 自分の変更で上限を超え、他の参加者に受け付けられなくなったり、次回に復元できなくなったりしないよう、余裕を持たせる
 */
const LOCAL_WRITE_LIMIT_CLIENTS = MAX_DOC_CLIENTS - 500;
/**
 * 同じ位置（同じ左隣の項目、または同じ親とキー）に挿入された項目の最大数
 * Yjsの衝突解決の計算量は、同じ位置に並行して挿入された項目の数の2乗で増えるため、これを超える更新は受け付けない
 * （ボードの操作では、同じ位置への挿入は同時に編集した人数分しか生じない）
 */
const MAX_INSERTS_PER_POSITION = 32;
/**
 * ルーム時計を同期できないまま、接続してからこの時間がたったら、自分の時計を基準にする
 * （小さいIDの参加者を装って接続と切断を繰り返し、同期を際限なく遅らせられないようにする）
 */
const CLOCK_MAX_WAIT_MS = 90 * 1000;
/** 依存する更新が届かないまま、保留中の更新（Yjsのpending）を抱えて受け付けるメッセージの最大数（受信のたびに保留中の更新のマージが走るため） */
const MAX_MESSAGES_WITH_PENDING = 200;
/** 端末に保存する最小間隔（受信のたびにボード全体を保存すると重いため） */
const PERSIST_INTERVAL_MS = 500;
/** ボードの正確なサイズを計算する最小間隔（計算が重いため） */
const EXACT_SIZE_CHECK_INTERVAL_MS = 5000;
/** 他の参加者から受け付けるスナップショット（Base64）の最大文字数 */
const MAX_SNAPSHOT_LENGTH = 256 * 1024;
/** ユーザーIDとして受け付ける最大文字数 */
const MAX_USER_ID_LENGTH = 64;

/** リモートから受信した更新であることを示すorigin */
const REMOTE_ORIGIN = Symbol('remote');
/** 端末に保存しておいた状態の復元であることを示すorigin */
const RESTORE_ORIGIN = Symbol('restore');

/**
 * 2つのY.Docのスナップショットが同じ状態を表すか判定する
 * 削除はYjsの状態ベクトルを変えないため、削除の記録（delete set）も含むスナップショットで比較する
 */
export function isSameDocState(a: Y.Snapshot, b: Y.Snapshot): boolean {
  try {
    return Y.equalSnapshots(a, b);
  } catch {
    // 不正なスナップショットの場合は、同じ状態とはみなさない
    return false;
  }
}

/*
 * 他の参加者から届くメッセージの検証
 * 招待URLを知っている参加者なら誰でも任意の値を送れるため、型と範囲を検証し、不正なメッセージは無視する
 */

function readNickname(value: unknown): string {
  return (typeof value === 'string' && normalizeNickname(value)) || '?';
}

function readPresence(payload: unknown): Participant | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const { userId, nickname } = payload as Record<string, unknown>;
  if (typeof userId !== 'string' || userId.length === 0 || userId.length > MAX_USER_ID_LENGTH) return null;
  return { userId, nickname: readNickname(nickname) };
}

export interface ExportedState {
  snapshot: Y.Snapshot;
  nickname: string;
  /** エクスポートした時刻（ルーム時刻） */
  exportedAt: number;
}

export function readExported(payload: unknown): (ExportedState & { isSync: boolean }) | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const { snapshot, nickname, isSync, exportedAt } = payload as Record<string, unknown>;
  if (typeof snapshot !== 'string' || snapshot.length > MAX_SNAPSHOT_LENGTH) return null;
  try {
    return {
      snapshot: Y.decodeSnapshot(decodeBase64(snapshot)),
      nickname: readNickname(nickname),
      exportedAt: typeof exportedAt === 'number' && Number.isFinite(exportedAt) ? exportedAt : 0,
      isSync: isSync === true,
    };
  } catch {
    return null;
  }
}

/**
 * 他の参加者から届いたルーム時刻を検証する（不正な値・自分の時計と大きくかけ離れた値はnull）
 */
export function readRoomTime(response: unknown, localNow: number): number | null {
  if (typeof response !== 'object' || response === null) return null;
  const { roomTime } = response as Record<string, unknown>;
  if (typeof roomTime !== 'number' || !Number.isFinite(roomTime)) return null;
  return Math.abs(roomTime - localNow) <= MAX_CLOCK_SKEW_MS ? roomTime : null;
}

/**
 * 項目が挿入された位置を表すキー（左隣の項目、左隣がない場合は親とキー）
 * Yjsの衝突解決では、同じ位置に並行して挿入された項目同士を比べる
 */
function getInsertPositionKey(item: Y.Item): string {
  if (item.origin) return `o:${item.origin.client}:${item.origin.clock}`;
  const parent = item.parent as unknown;
  const parentKey =
    typeof parent === 'string'
      ? `s:${parent}`
      : parent && typeof parent === 'object' && 'client' in parent
        ? `i:${(parent as Y.ID).client}:${(parent as Y.ID).clock}`
        : '';
  return `p:${parentKey}:${item.parentSub ?? ''}`;
}

function getByteLength(data: unknown): number {
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (ArrayBuffer.isView(data)) return data.byteLength;
  return Number.POSITIVE_INFINITY;
}

function encodeBase64(bytes: Uint8Array): string {
  // 一度に展開すると引数が多すぎて例外になるため、分割して文字列に変換する
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export interface Participant {
  userId: string;
  nickname: string;
}

type PresencePayload = { userId: string; nickname: string };
/**
 * エクスポートした時点のY.Docのスナップショット（Base64）とエクスポートした人のニックネーム
 * isSyncは、新しく参加した人にエクスポート済みの状態を伝えるための送信であることを表す（通知を出さない）
 */
type ExportedPayload = { snapshot: string; nickname: string; exportedAt: number; isSync?: boolean };
type ClockResponse = { roomTime: number | null };

export interface P2PRoomSnapshot extends KptDocSnapshot {
  /** 自分を含む参加者（同一ユーザーの複数タブは1人として数える） */
  participants: Participant[];
  /** 接続中の他の参加者の数 */
  peerCount: number;
  /** ルーム時計の同期が完了しているか */
  isClockSynced: boolean;
  /** ルーム時刻からローカル時刻を引いた差（ms） */
  clockOffset: number;
  /** 実行中のタイマー（ルーム時計の同期前、または時間切れの場合はnull） */
  timer: DocTimer | null;
  /**
   * 他の人のカードを隠すか
   * ルーム時計の同期前もタイマーの終了を判定できないため、タイマーがあれば隠す側に倒す（同期した時点で正しく判定し直す）
   */
  hidesOthersCards: boolean;
  /** ボードのサイズが上限に近く、変更を受け付けられないか（他の参加者の変更を受け付けられなかった場合も含む） */
  isBoardFull: boolean;
  /** 自分が最後にエクスポートした後にボードが変更されたか（一度もエクスポートしていない場合はカードがあればtrue） */
  hasUnexportedChanges: boolean;
}

export interface P2PRoomOptions {
  roomId: string;
  secret: string;
  userId: string;
  nickname: string;
  /** 自分の時計をルーム時計の基準にするか（ルームを作成した直後のみtrue） */
  isClockReference: boolean;
  /** 他の参加者がエクスポートした際に呼び出す */
  onRemoteExport?: (nickname: string) => void;
  /** シグナリングサーバー上のルームキー（createRoomKeyで生成する。TrysteroのルームIDとしても用いる） */
  signalingRoomKey: string;
  /** シグナリングサーバー上のルームのURL（buildSignalingRoomUrlで生成する） */
  signalingRoomUrl: string;
  /** ボードの状態を端末に保存する処理（ボード名を受信する前の空の状態では呼び出さない） */
  persist?: (state: Uint8Array, boardName: string) => void;
}

/**
 * P2Pのルーム
 *
 * Trysteroで参加者同士を接続し、以下を同期する。
 * - Y.Doc（ボードの内容）
 * - 参加者情報（ユーザーIDとニックネーム）
 * - ルーム時計
 */
export class P2PRoom {
  readonly doc: Y.Doc;
  readonly clock = new RoomClock();

  private room: Room | null = null;
  private docAction: MessageAction<Uint8Array> | null = null;
  private presenceAction: MessageAction<PresencePayload> | null = null;
  private exportedAction: MessageAction<ExportedPayload> | null = null;
  private clockAction: RequestAction<number, ClockResponse> | null = null;

  private readonly participantsByPeerId = new Map<string, Participant>();
  private readonly listeners = new Set<() => void>();
  private snapshot: P2PRoomSnapshot | null = null;
  /** 実行中のルーム時刻の問い合わせ（同時に1件まで） */
  private clockSyncPromise: Promise<void> | null = null;
  /** ルーム時刻を問い合わせ済みの参加者（未同期の参加者同士で問い合わせが繰り返されないようにする） */
  private readonly clockQueriedPeerIds = new Set<string>();
  private clockFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private nickname: string;
  /** 端末への保存を予約済みか（同じタイミングで起きた複数の変更をまとめて保存するため） */
  private isPersistQueued = false;
  /** ルームの誰かが最後にエクスポートした時点のY.Docの状態ベクトル */
  private exported: ExportedState | null = null;
  /** タイマーの時間切れ時に画面へ変更を知らせるためのタイマー */
  private timerExpiryTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 最後に読み出せたボード名（ボード名を不正な値にされても、端末への保存を続けるため） */
  private lastBoardName = '';
  /**
   * ボード全体のサイズの見積もり（bytes）。適用した更新のサイズを足していく上限値で、一定間隔で正確な値に置き換える
   * 受信のたびに正確なサイズを計算すると重く、小さなメッセージの連打で画面を固められてしまうため
   */
  private estimatedDocBytes = 0;
  /** 最後に数えたYjsの項目（struct）の数（見積もりに項目数の増加分を加えるため） */
  private structCount = 0;
  /** 最後に端末へ保存した時刻 */
  private lastPersistedAt = 0;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private isMicrotaskQueued = false;
  /** 保留中の更新（Yjsのpending）を抱えたまま受け付けたメッセージの数 */
  private messagesWithPending = 0;
  private lastExactSizeCheckAt = 0;
  /** 上限を超えるため他の参加者の変更を受け付けなかったか（参加者ごとに内容が食い違っている可能性がある） */
  private hasRejectedRemoteUpdate = false;
  /** 位置ごとの、挿入された項目の数（衝突解決が重くなる更新を受け付けないため） */
  private insertCountsByPosition = new Map<string, number>();
  /** シグナリングサーバーに接続した時刻（performance.now()） */
  private connectedAt = 0;
  /** 参加者ごとの接続した時刻（performance.now()） */
  private peerJoinedAt = new Map<string, number>();
  /** ルーム時計の同期前にエクスポートした自分のエクスポート状態（同期後に時刻を付けて他の参加者に知らせる） */
  private pendingOwnExport: ExportedState | null = null;

  constructor(private readonly options: P2PRoomOptions) {
    this.nickname = options.nickname;
    this.doc = new Y.Doc({ guid: options.roomId });
    this.doc.on('update', this.handleDocUpdate);
    this.estimatedDocBytes = Y.encodeStateAsUpdate(this.doc).byteLength;
    this.structCount = this.countStructs();

    if (options.isClockReference) {
      this.clock.markAsReference();
    }
  }

  get userId(): string {
    return this.options.userId;
  }

  getNickname(): string {
    return this.nickname;
  }

  /**
   * 端末に保存しておいた状態を復元する（接続前に呼び出す）
   */
  restore(state: Uint8Array): boolean {
    try {
      // 参加者（clientID）が多すぎる保存データは、復元に時間がかかり画面が固まるため復元しない
      if (this.countClientsWith(Y.parseUpdateMeta(state).from) > MAX_DOC_CLIENTS) return false;
      Y.applyUpdate(this.doc, state, RESTORE_ORIGIN);
      this.insertCountsByPosition.clear();
      this.commitInsertCounts(this.countInsertsByPosition(Y.encodeStateAsUpdate(this.doc)));
      this.lastBoardName = readBoardName(this.doc) || this.lastBoardName;
      this.estimatedDocBytes = Y.encodeStateAsUpdate(this.doc).byteLength;
      this.structCount = this.countStructs();
      return true;
    } catch {
      // 保存データが壊れている場合は復元せず、他の参加者から同期する（次回の保存で上書きされる）
      return false;
    }
  }

  /**
   * エクスポートしたことを記録し、接続中の他の参加者にも知らせる（以降の変更有無の判定に用いる）
   * 誰か1人がエクスポートすればチームの記録としては足りるため、エクスポート済みの状態はルーム全体で共有する
   */
  markExported(): void {
    const state: ExportedState = { snapshot: Y.snapshot(this.doc), nickname: this.nickname, exportedAt: this.clock.now() };
    this.exported = state;
    if (this.clock.isSynced()) {
      this.sendExported(state, false);
    } else {
      // ルーム時計の同期前は端末の時計がずれている可能性があるため、同期した時点で時刻を付け直して知らせる
      this.pendingOwnExport = state;
    }
    this.notify();
  }

  private sendExported(state: ExportedState, isSync: boolean, target?: string): void {
    try {
      const payload: ExportedPayload = {
        snapshot: encodeBase64(Y.encodeSnapshot(state.snapshot)),
        nickname: state.nickname,
        exportedAt: state.exportedAt,
        isSync,
      };
      void this.exportedAction?.send(payload, target ? { target } : undefined);
    } catch {
      // 送信できない場合は、次のエクスポートで知らせる
    }
  }

  /**
   * ルーム時計が同期した時点の処理
   * 同期前に受け付けたエクスポート状態の時刻を検証し、同期前に行った自分のエクスポートを他の参加者に知らせる
   */
  private handleClockSynced(): void {
    const now = this.clock.now();
    const ownExport = this.pendingOwnExport;
    this.pendingOwnExport = null;
    if (ownExport && this.exported === ownExport) {
      // 同期前に行った自分のエクスポートは、端末の時計ではなくルーム時刻を付け直して知らせる
      const state = { ...ownExport, exportedAt: now };
      this.exported = state;
      this.sendExported(state, false);
    } else if (this.exported && this.exported.exportedAt > now + MAX_EXPORTED_AT_FUTURE_MS) {
      this.exported = null;
    }
    this.notify();
  }

  /**
   * 他の参加者から届いたボードの更新を適用する
   */
  private handleRemoteDoc(update: ArrayBuffer | Uint8Array): void {
    // 大きすぎる更新や壊れた更新は適用しない（他の参加者の画面が固まったり落ちたりしないようにする）
    // 適用後のボード全体が上限を超える場合も適用しない（後から参加した人が同期できなくなるのを防ぐ）
    const updateSize = getByteLength(update);
    if (updateSize > MAX_DOC_BYTES) {
      this.rejectRemoteUpdate();
      return;
    }
    try {
      const updateBytes = new Uint8Array(update);
      // 見積もり（上限値）で収まる場合は、重い正確なサイズの計算を省く
      if (this.estimatedDocBytes + updateSize > MAX_DOC_BYTES) {
        this.refreshDocBytes(false);
        // 参加時に届く全状態は大半がすでに持っている内容のため、持っていない部分のサイズで判定する
        const newBytes = Y.diffUpdate(updateBytes, Y.encodeStateVector(this.doc)).byteLength;
        if (this.estimatedDocBytes + newBytes > MAX_DOC_BYTES) {
          this.rejectRemoteUpdate();
          return;
        }
      }
      // 参加者（clientID）が多すぎるボードになる更新は適用しない（保留中の更新に含まれる参加者も数える）
      if (this.countClientsWith(Y.parseUpdateMeta(updateBytes).from) > MAX_DOC_CLIENTS) {
        this.rejectRemoteUpdate();
        return;
      }
      // 同じ位置に多数の項目を挿入する更新は、衝突解決に時間がかかり画面が固まるため適用しない（持っていない部分だけを数える）
      const newContent = Y.diffUpdate(updateBytes, Y.encodeStateVector(this.doc));
      const insertCounts = this.countInsertsByPosition(newContent);
      if ([...insertCounts.values()].some((count) => count > MAX_INSERTS_PER_POSITION)) {
        this.rejectRemoteUpdate();
        return;
      }
      Y.applyUpdate(this.doc, updateBytes, REMOTE_ORIGIN);
      // 適用できた場合のみ、数えた結果を確定する
      this.commitInsertCounts(insertCounts);
      this.discardLargePendingUpdates();
    } catch {
      // 壊れた更新は無視する
    }
  }

  private rejectRemoteUpdate(): void {
    this.hasRejectedRemoteUpdate = true;
    this.notify();
  }

  /**
   * 依存する更新が届いていないため保留している更新（Yjsのpending）が大きすぎる場合は破棄する
   * pendingはupdateイベントが発火せずサイズの見積もりに含まれないため、上限を回り込んで溜め込まれないようにする
   */
  private discardLargePendingUpdates(): void {
    const store = this.doc.store as { pendingStructs: { update: Uint8Array } | null; pendingDs: Uint8Array | null };
    if (!store.pendingStructs && !store.pendingDs) {
      this.messagesWithPending = 0;
      return;
    }
    this.messagesWithPending += 1;
    const pendingDeleteBytes = store.pendingDs?.byteLength ?? 0;
    const pendingBytes = (store.pendingStructs?.update.byteLength ?? 0) + pendingDeleteBytes;
    if (
      pendingBytes <= MAX_PENDING_UPDATE_BYTES &&
      pendingDeleteBytes <= MAX_PENDING_DELETE_BYTES &&
      this.messagesWithPending <= MAX_MESSAGES_WITH_PENDING
    ) {
      if (this.estimatedDocBytes + pendingBytes <= MAX_DOC_BYTES) return;
      // 見積もりは実際より大きいことがあるため、正確なサイズで判定し直す（通常の通信でも届く順番が入れ替わると小さなpendingが生じるため）
      this.refreshDocBytes(true);
      if (this.estimatedDocBytes + pendingBytes <= MAX_DOC_BYTES) return;
    }
    store.pendingStructs = null;
    store.pendingDs = null;
    this.messagesWithPending = 0;
    this.rejectRemoteUpdate();
  }

  /**
   * ボードのサイズが上限に近く、変更を受け付けられないか
   */
  isBoardFull(): boolean {
    this.refreshDocBytes(false);
    return (
      this.estimatedDocBytes >= LOCAL_WRITE_LIMIT_BYTES ||
      this.doc.store.clients.size >= LOCAL_WRITE_LIMIT_CLIENTS ||
      this.hasRejectedRemoteUpdate
    );
  }

  /**
   * ボードの正確なサイズを計算し直す（見積もりが大きい場合のみ。forceがfalseの場合は一定間隔に1回まで）
   */
  private refreshDocBytes(force: boolean): void {
    if (this.estimatedDocBytes < LOCAL_WRITE_LIMIT_BYTES / 2) return;
    if (!force && Date.now() - this.lastExactSizeCheckAt < EXACT_SIZE_CHECK_INTERVAL_MS) return;
    this.lastExactSizeCheckAt = Date.now();
    this.estimatedDocBytes = Y.encodeStateAsUpdate(this.doc).byteLength;
  }

  /**
   * ボード上の自分の名前（作成者・担当者・投票）を、今のニックネームにそろえる
   * 再開用ファイルから作成した場合や、別のボードでニックネームを変えた後に開き直した場合に、古い名前が残らないようにする
   */
  syncOwnNickname(): void {
    if (this.isBoardFull()) return;
    renameParticipant(this.doc, this.options.userId, this.nickname);
  }

  connect(): void {
    if (this.room) return;
    this.connectedAt = performance.now();
    // 端末に保存しておいた状態を復元した後、他の参加者と同期する前に自分の名前をそろえる
    this.syncOwnNickname();

    const room = joinRoom(
      { appId: APP_ID, password: this.options.secret, relayConfig: { urls: [this.options.signalingRoomUrl] } },
      this.options.signalingRoomKey
    );
    this.room = room;

    this.docAction = room.makeAction<Uint8Array>('doc', {
      onMessage: (update) => this.handleRemoteDoc(update),
    });

    this.presenceAction = room.makeAction<PresencePayload>('presence', {
      onMessage: (payload, { peerId }) => {
        const participant = readPresence(payload);
        if (!participant) return;
        this.participantsByPeerId.set(peerId, participant);
        this.notify();
      },
    });

    this.exportedAction = room.makeAction<ExportedPayload>('exported', {
      onMessage: (payload) => {
        const exported = readExported(payload);
        if (!exported) return;
        // 未来すぎるエクスポート時刻は受け付けない（以降の正規のエクスポートがすべて無視されてしまうため）
        // ルーム時計の同期前は自分の時計がずれている可能性があるため、同期した時点で検証する（handleClockSynced）
        if (this.clock.isSynced() && exported.exportedAt > this.clock.now() + MAX_EXPORTED_AT_FUTURE_MS) return;
        if (this.pendingOwnExport && this.exported === this.pendingOwnExport) {
          // 同期前の自分のエクスポートは端末の時計で記録しているため時刻では比べない
          // 参加時に届く過去のエクスポート状態よりは新しく、その後に他の参加者が行ったエクスポートよりは古いものとして扱う
          if (exported.isSync) return;
          this.pendingOwnExport = null;
        } else if (this.exported && exported.exportedAt < this.exported.exportedAt) {
          // 再接続した参加者から届く古いエクスポート状態で、新しい状態を上書きしない
          return;
        }
        const { isSync, ...state } = exported;
        this.exported = state;
        if (!isSync) this.options.onRemoteExport?.(exported.nickname);
        this.notify();
      },
    });

    this.clockAction = room.makeAction<number, ClockResponse>('clock', {
      kind: 'request',
      // 同期済みの参加者のみルーム時刻を回答する
      onRequest: () => ({ roomTime: this.clock.isSynced() ? this.clock.now() : null }),
    });

    room.onPeerJoin = (peerId) => {
      this.peerJoinedAt.set(peerId, performance.now());
      // 新しい参加者に自分の持つ全状態と参加者情報を送る（相手からも同様に送られてくるため、双方の状態が揃う）
      void this.docAction?.send(Y.encodeStateAsUpdate(this.doc), { target: peerId });
      void this.presenceAction?.send(this.getPresence(), { target: peerId });
      // エクスポート済みの状態も伝え、後から参加した人に「エクスポート後に変更があります」が誤って表示されないようにする
      if (this.exported && this.exported !== this.pendingOwnExport) this.sendExported(this.exported, true, peerId);
      void this.syncClockWith(peerId);
      this.notify();
    };

    room.onPeerLeave = (peerId) => {
      this.participantsByPeerId.delete(peerId);
      this.peerJoinedAt.delete(peerId);
      this.notify();
    };

    if (!this.clock.isSynced()) {
      this.scheduleClockFallback(CLOCK_FALLBACK_DELAY_MS);
    }
  }

  /**
   * 保存待ちの変更があれば、すぐに端末へ保存する（タブを閉じる・切り替える際に呼び出す）
   */
  flushPersist(): void {
    if (this.isPersistQueued) this.persistNow();
  }

  destroy(): void {
    // Y.Docを破棄する前に、保存待ちの変更を保存する
    this.flushPersist();
    if (this.clockFallbackTimer) clearTimeout(this.clockFallbackTimer);
    this.clockFallbackTimer = null;
    if (this.timerExpiryTimeout) clearTimeout(this.timerExpiryTimeout);
    this.timerExpiryTimeout = null;
    this.doc.off('update', this.handleDocUpdate);
    void this.room?.leave();
    this.room = null;
    this.docAction = null;
    this.presenceAction = null;
    this.exportedAction = null;
    this.clockAction = null;
    this.participantsByPeerId.clear();
    this.listeners.clear();
    this.doc.destroy();
  }

  /**
   * 自分のニックネームを変更する
   * 他の参加者に参加者情報を送り直し、ボード上の自分の名前（作成者・担当者・投票）も書き換える
   */
  setNickname(nickname: string): void {
    this.nickname = nickname;
    // ボードの容量が上限に近い場合は、ボード内の名前は書き換えない（参加中の表示名のみ変更する）
    if (!this.isBoardFull()) renameParticipant(this.doc, this.options.userId, nickname);
    void this.presenceAction?.send(this.getPresence());
    this.notify();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): P2PRoomSnapshot => {
    this.snapshot ??= this.createSnapshot();
    return this.snapshot;
  };

  private createSnapshot(): P2PRoomSnapshot {
    const participants = new Map<string, Participant>();
    participants.set(this.options.userId, { userId: this.options.userId, nickname: this.nickname });
    for (const participant of this.participantsByPeerId.values()) {
      if (!participants.has(participant.userId)) {
        participants.set(participant.userId, participant);
      }
    }

    const docSnapshot = readSnapshot(this.doc, this.options.userId);
    const exported = this.exported;
    const runningTimer = this.getRunningTimer(docSnapshot.timer);

    return {
      ...docSnapshot,
      timer: runningTimer,
      hidesOthersCards: runningTimer ? runningTimer.hideOthersCards : !this.clock.isSynced() && docSnapshot.timer?.hideOthersCards === true,
      participants: [...participants.values()],
      peerCount: this.room ? Object.keys(this.room.getPeers()).length : 0,
      isClockSynced: this.clock.isSynced(),
      clockOffset: this.clock.getOffset(),
      isBoardFull: this.isBoardFull(),
      hasUnexportedChanges: docSnapshot.items.length > 0 && (exported === null || !isSameDocState(Y.snapshot(this.doc), exported.snapshot)),
    };
  }

  /**
   * 実行中のタイマーを返す（ルーム時計の同期前、または時間切れの場合はnull）
   *
   * 時間切れはルーム全体の状態を書き換えず、各自がルーム時計をもとに判定する。
   * 同期前の時計で判定すると、終わったタイマーを実行中と表示したり、同期した時点で誤った終了通知が出たりするため、同期前は表示しない。
   * 終了時刻になったら画面に変更を知らせ、タイマーの表示を終了させる。
   */
  private getRunningTimer(timer: DocTimer | null): DocTimer | null {
    if (this.timerExpiryTimeout) clearTimeout(this.timerExpiryTimeout);
    this.timerExpiryTimeout = null;
    if (!timer || !this.clock.isSynced()) return null;

    const now = this.clock.now();
    // 未来に開始するタイマーは不正な値として扱う（他の人のカードが長期間隠れたり、終了の判定が成り立たなくなったりするため）
    if (timer.startedAtRoomTime > now + TIMER_TOLERANCE_MS) return null;
    const remainingMs = timer.startedAtRoomTime + timer.durationSeconds * 1000 - now;
    if (remainingMs <= 0) return null;
    // setTimeoutの上限を超えると即時に実行され、再描画が繰り返されてしまうため、上限で抑える
    this.timerExpiryTimeout = setTimeout(() => this.notify(), Math.min(remainingMs, MAX_TIMEOUT_MS));
    return timer;
  }

  private notify(): void {
    this.snapshot = null;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private getPresence(): PresencePayload {
    return { userId: this.options.userId, nickname: this.nickname };
  }

  /**
   * 端末への保存を予約する
   * 自分の変更は、直後にページを離れても保存されるよう遅らせずに保存する（同じタスク内の複数の変更はマイクロタスクでまとめる）
   * 他の参加者の変更は、受信のたびにボード全体を保存すると重いため、前回の保存から一定の間隔を空けてまとめて保存する
   * （他の参加者も同じ内容を持っているため、保存が遅れても再接続時に同期できる）
   *
   * @param immediate 遅らせずに保存するか
   */
  private schedulePersist(immediate: boolean): void {
    if (!this.options.persist) return;
    // 端末の時計が巻き戻っても保存が長く遅れないよう、待ち時間は保存の間隔までに抑える
    const delayMs = immediate ? 0 : Math.min(PERSIST_INTERVAL_MS, Math.max(0, this.lastPersistedAt + PERSIST_INTERVAL_MS - Date.now()));
    if (delayMs === 0) {
      // 間隔を空けて保存する予約があれば、すぐの保存に切り替える
      if (this.persistTimer) clearTimeout(this.persistTimer);
      this.persistTimer = null;
      this.isPersistQueued = true;
      if (this.isMicrotaskQueued) return;
      this.isMicrotaskQueued = true;
      queueMicrotask(() => {
        this.isMicrotaskQueued = false;
        if (this.isPersistQueued) this.persistNow();
      });
    } else if (!this.isPersistQueued) {
      this.isPersistQueued = true;
      this.persistTimer = setTimeout(() => {
        if (this.isPersistQueued) this.persistNow();
      }, delayMs);
    }
  }

  private persistNow(): void {
    this.isPersistQueued = false;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.lastPersistedAt = Date.now();

    const name = readBoardName(this.doc);
    if (name) this.lastBoardName = name;
    // ボード情報を受信する前の空の状態は保存しない
    if (!this.lastBoardName) return;
    this.options.persist?.(Y.encodeStateAsUpdate(this.doc), this.lastBoardName);
  }

  private handleDocUpdate = (update: Uint8Array, origin: unknown): void => {
    // 自分の変更のみ他の参加者に送る（受信した更新や復元した状態は、参加時に全状態として送るため個別には送らない）
    if (origin !== REMOTE_ORIGIN && origin !== RESTORE_ORIGIN) {
      void this.docAction?.send(update);
    }
    // 復元した状態は端末に保存済みのため、保存し直さない
    if (origin !== RESTORE_ORIGIN) this.schedulePersist(origin !== REMOTE_ORIGIN);
    // 適用した更新のサイズと、増えた項目の数を足して、ボード全体のサイズを見積もる
    const structCount = this.countStructs();
    if (origin !== RESTORE_ORIGIN) {
      this.estimatedDocBytes += update.byteLength + Math.max(0, structCount - this.structCount) * ESTIMATED_BYTES_PER_STRUCT;
    }
    this.structCount = structCount;
    this.notify();
  };

  /**
   * 更新に含まれる項目を、挿入された位置ごとに数え、これまでの数と合わせた数を返す（数えた結果はcommitInsertCountsで確定する）
   * 保留中の更新（Yjsのpending）に含まれる項目は、受信した時点で数えているため数えない
   */
  private countInsertsByPosition(update: Uint8Array): Map<string, number> {
    const isPending = this.createPendingItemChecker();
    const counts = new Map<string, number>();
    for (const struct of Y.decodeUpdate(update).structs) {
      if (!(struct instanceof Y.Item) || isPending(struct.id)) continue;
      const key = getInsertPositionKey(struct);
      counts.set(key, (counts.get(key) ?? this.insertCountsByPosition.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private commitInsertCounts(counts: Map<string, number>): void {
    for (const [key, count] of counts) this.insertCountsByPosition.set(key, count);
  }

  /**
   * 項目が保留中の更新（Yjsのpending）に含まれるかを判定する関数を作る
   */
  private createPendingItemChecker(): (id: Y.ID) => boolean {
    const store = this.doc.store as unknown as { pendingStructs: { update: Uint8Array } | null };
    if (!store.pendingStructs) return () => false;
    // 参加者ごとに、保留中の項目のclockの範囲を集める（保留中の更新はV2形式で保持されている）
    const rangesByClient = new Map<number, [number, number][]>();
    for (const struct of Y.decodeUpdateV2(store.pendingStructs.update).structs) {
      const ranges = rangesByClient.get(struct.id.client) ?? [];
      ranges.push([struct.id.clock, struct.id.clock + struct.length]);
      rangesByClient.set(struct.id.client, ranges);
    }
    for (const ranges of rangesByClient.values()) ranges.sort((a, b) => a[0] - b[0]);
    // 項目の数が多くても判定が重くならないよう、範囲を二分探索する
    return (id) => {
      const ranges = rangesByClient.get(id.client);
      if (!ranges) return false;
      let low = 0;
      let high = ranges.length - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const [start, end] = ranges[middle];
        if (id.clock < start) high = middle - 1;
        else if (id.clock >= end) low = middle + 1;
        else return true;
      }
      return false;
    };
  }

  /**
   * 更新に含まれる参加者（clientID）を加えた場合の、ボードの参加者の数を数える
   * 保留中の更新（Yjsのpending）に含まれる参加者も、後からまとめて適用されるため数える
   */
  private countClientsWith(updateClients: Map<number, number>): number {
    const store = this.doc.store as unknown as { clients: Map<number, unknown>; pendingStructs: { update: Uint8Array } | null };
    const clientIds = new Set<number>(store.clients.keys());
    for (const clientId of updateClients.keys()) clientIds.add(clientId);
    if (store.pendingStructs) {
      // 保留中の更新はV2形式で保持されている
      for (const clientId of Y.parseUpdateMetaV2(store.pendingStructs.update).from.keys()) clientIds.add(clientId);
    }
    return clientIds.size;
  }

  /**
   * Yjsの項目（struct）の数を数える（参加者数に比例する手間で求められる）
   */
  private countStructs(): number {
    let count = 0;
    for (const structs of this.doc.store.clients.values()) count += structs.length;
    return count;
  }

  /**
   * 指定した参加者にルーム時刻を問い合わせ、時刻差を推定する
   */
  /**
   * @param chain 同期できなかった場合に、まだ問い合わせていない参加者へ続けて問い合わせるか
   */
  private syncClockWith(peerId: string, chain = true): Promise<void> {
    if (this.clock.isSynced() || this.clockSyncPromise || !this.clockAction) return Promise.resolve();
    const promise = this.querySamples(peerId).finally(() => {
      this.clockSyncPromise = null;
      // 同期できなかった場合は、まだ問い合わせていない接続中の参加者に問い合わせる
      if (chain && !this.clock.isSynced() && this.room) {
        const nextPeerId = Object.keys(this.room.getPeers()).find((id) => !this.clockQueriedPeerIds.has(id));
        if (nextPeerId) void this.syncClockWith(nextPeerId);
      }
    });
    this.clockSyncPromise = promise;
    return promise;
  }

  private async querySamples(peerId: string): Promise<void> {
    if (!this.clockAction) return;
    this.clockQueriedPeerIds.add(peerId);

    const samples: ClockSample[] = [];
    for (let i = 0; i < CLOCK_SAMPLE_COUNT; i++) {
      const sentAt = Date.now();
      let response: unknown;
      try {
        response = await this.clockAction.request(0, { target: peerId, timeoutMs: CLOCK_REQUEST_TIMEOUT_MS });
      } catch {
        // 応答が遅い場合や相手が切断した場合は問い合わせを打ち切り、それまでに得られた時刻で推定する
        break;
      }
      const receivedAt = Date.now();
      // 相手も未同期の場合や、不正な時刻が返ってきた場合は問い合わせを打ち切る
      const roomTime = readRoomTime(response, receivedAt);
      if (roomTime === null) break;
      samples.push({ sentAt, receivedAt, remoteTime: roomTime });
      if (!this.clockAction) return;
    }

    if (!this.clock.isSynced() && this.clock.applySamples(samples)) {
      if (this.clockFallbackTimer) clearTimeout(this.clockFallbackTimer);
      this.handleClockSynced();
    }
  }

  private scheduleClockFallback(delayMs: number): void {
    if (this.clockFallbackTimer) clearTimeout(this.clockFallbackTimer);
    this.clockFallbackTimer = setTimeout(() => void this.resolveClockFallback(), delayMs);
  }

  /**
   * 時刻を回答できる参加者が見つからない場合に、ルーム時計の基準を決める
   *
   * 未同期の参加者が全員それぞれ自分の時計を基準にすると、参加者ごとにタイマーの終了時刻がずれる。
   * そのため、接続中の参加者の中でIDが最も小さい1人だけが基準になり、他の参加者はその人に問い合わせ直す。
   */
  /**
   * 自分が時計の基準になってよいか
   * 自分より小さいIDの参加者がいなければ基準になる。いる場合は、接続してから一定時間たっても回答しない参加者だけを考慮から外す。
   * 外すまでの時間は、IDの小さい順に長くする（回答しない参加者の次に小さいIDの参加者が基準になるのを待ち、複数の参加者が同時に基準になるのを防ぐ）
   */
  private canBecomeClockReference(): boolean {
    const now = performance.now();
    if (now - this.connectedAt >= CLOCK_MAX_WAIT_MS) return true;
    const smallerPeerIds = Object.keys(this.room?.getPeers() ?? {})
      .filter((peerId) => peerId < selfId)
      .sort();
    return smallerPeerIds.every((peerId, index) => {
      // 接続した時刻がわからない参加者は、初めて確認した時刻から数える
      if (!this.peerJoinedAt.has(peerId)) this.peerJoinedAt.set(peerId, now);
      const joinedAt = this.peerJoinedAt.get(peerId) ?? now;
      return now - joinedAt >= (index + 1) * CLOCK_UNRESPONSIVE_PEER_MS;
    });
  }

  private async resolveClockFallback(): Promise<void> {
    this.clockFallbackTimer = null;
    if (this.clock.isSynced() || !this.room) return;

    // 待っている間に同期済みになった参加者がいないか、接続中の全員に改めて問い合わせる
    // 実行中の問い合わせがあれば終わるのを待ち、1人ずつ順に問い合わせる
    while (this.clockSyncPromise) await this.clockSyncPromise;
    this.clockQueriedPeerIds.clear();
    for (const peerId of Object.keys(this.room?.getPeers() ?? {})) {
      while (this.clockSyncPromise) await this.clockSyncPromise;
      if (this.clock.isSynced() || !this.room) return;
      await this.syncClockWith(peerId, false);
    }
    while (this.clockSyncPromise) await this.clockSyncPromise;
    if (this.clock.isSynced() || !this.room) return;

    if (this.canBecomeClockReference()) {
      this.clock.markAsReference();
      this.handleClockSynced();
    } else {
      this.scheduleClockFallback(CLOCK_RETRY_DELAY_MS);
    }
  }
}
