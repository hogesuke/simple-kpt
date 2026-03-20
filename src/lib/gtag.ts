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

  window.gtag('event', 'page_view', {
    page_path: path,
  });
}
