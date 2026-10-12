import { sanitizeUrl } from '@/lib/url-sanitizer';

/**
 * Google Analyticsの初期化とページビュートラッキング
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** Google Analyticsに送信するページタイトル（ボード名を送信しないよう固定する） */
const PAGE_TITLE = 'Simple KPT';

/**
 * Google Analyticsに送信しても問題のないページの情報を作る（ルームIDと鍵、ボード名を含めない）
 */
function getPrivacySafePageParams(path: string): { page_location: string; page_title: string } {
  return { page_location: `${window.location.origin}${sanitizeUrl(path)}`, page_title: PAGE_TITLE };
}

/**
 * Google Analyticsの初期化処理
 */
export function initGA(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  if (!measurementId || !import.meta.env.PROD) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // SPAのため手動でページビューを送信する
    // 初期表示の時点から、ルームIDと鍵を取り除いたURLと固定のページタイトルを送信する
    ...getPrivacySafePageParams(window.location.pathname),
  });

  initialized = true;
}

/**
 * ページビューイベントをGA4に送信
 */
export function trackPageView(path: string): void {
  if (!initialized) {
    return;
  }

  // page_location・page_titleを指定しない場合は、document.location.href（ルームURLの#以降の鍵を含む）と
  // document.title（ボード名を含む）が送信されるため、page_view以外の自動収集イベントも含めて送信される値を上書きする
  const params = getPrivacySafePageParams(path);
  window.gtag('set', params);
  window.gtag('event', 'page_view', { page_path: sanitizeUrl(path), ...params });
}
