/**
 * ルーム時計
 *
 * 参加者の端末時計のずれを吸収するため、ルーム作成者の時計を基準（ルーム時計）とする。
 * 各参加者は基準との時刻差（offset）をNTPと同じ考え方で推定し、
 * 「自分の時計＋offset」をルーム時刻として扱う。
 * 時刻差を推定済みの参加者は誰でも他の参加者に時刻を回答できるため、作成者が退出しても成り立つ。
 */

/** 時刻問い合わせ1回分の計測結果 */
export interface ClockSample {
  /** 問い合わせを送信したローカル時刻（ms） */
  sentAt: number;
  /** 回答を受信したローカル時刻（ms） */
  receivedAt: number;
  /** 回答者のルーム時刻（ms） */
  remoteTime: number;
}

/**
 * 計測結果から基準との時刻差を推定する
 * 往復時間が最も短い計測結果を採用し、片道時間を往復時間の半分とみなして補正する
 */
export function estimateOffset(samples: ClockSample[]): number | null {
  const validSamples = samples.filter((s) => s.receivedAt >= s.sentAt);
  if (validSamples.length === 0) return null;

  const best = validSamples.reduce((a, b) => (b.receivedAt - b.sentAt < a.receivedAt - a.sentAt ? b : a));
  const midpoint = (best.sentAt + best.receivedAt) / 2;
  return Math.round(best.remoteTime - midpoint);
}

export class RoomClock {
  private offset = 0;
  private synced = false;

  constructor(private readonly getLocalTime: () => number = () => Date.now()) {}

  /** 自分の時計を基準にする（ルーム作成者、または基準を持つ参加者がいない場合） */
  markAsReference(): void {
    this.offset = 0;
    this.synced = true;
  }

  /** 計測結果を適用する。推定できた場合はtrueを返す */
  applySamples(samples: ClockSample[]): boolean {
    const offset = estimateOffset(samples);
    if (offset === null) return false;
    this.offset = offset;
    this.synced = true;
    return true;
  }

  isSynced(): boolean {
    return this.synced;
  }

  getOffset(): number {
    return this.offset;
  }

  /** 現在のルーム時刻 */
  now(): number {
    return this.getLocalTime() + this.offset;
  }

  /** ルーム時刻をローカル時刻に変換する */
  toLocalTime(roomTime: number): number {
    return roomTime - this.offset;
  }
}
