const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ROOM_PATH_REGEX = /\/r\/[^/?#]+/g;

/**
 * 外部サービス（Sentry・Google Analytics）に送信するURLから識別情報を取り除く
 *
 * - クエリ文字列とハッシュ（#以降）を削除する。ルームURLの#以降は接続の暗号化に用いる鍵のため、外部に送信してはならない
 * - ルームID（/r/以降）とUUIDを[Filtered]に置換する
 */
export function sanitizeUrl(url: string): string {
  const withoutQueryAndHash = url.replace(/[?#].*$/, '');
  return withoutQueryAndHash.replace(ROOM_PATH_REGEX, '/r/[Filtered]').replace(UUID_REGEX, '[Filtered]');
}
