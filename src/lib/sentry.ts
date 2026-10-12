import * as Sentry from '@sentry/react';

import { sanitizeUrl } from '@/lib/url-sanitizer';

/**
 * Sentryの初期化処理
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // パフォーマンス監視のサンプリングレート
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // プライバシー設定 (IPアドレスを収集しない)
    sendDefaultPii: false,

    // 開発環境ではSentryを無効化
    enabled: import.meta.env.PROD,

    beforeSend(event) {
      // ユーザー情報を削除
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }

      // URLからクエリ文字列・ハッシュ・ルームIDを削除（ルームURLの#以降には接続用の鍵が含まれるため）
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }

      // クエリ文字列を削除
      if (event.request?.query_string) {
        delete event.request.query_string;
      }

      // エラーイベントにも、画面遷移に基づくトランザクション名（URLのパス）が付くため、ルームIDを削除する
      if (event.transaction) {
        event.transaction = sanitizeUrl(event.transaction);
      }
      if (typeof event.tags?.transaction === 'string') {
        event.tags.transaction = sanitizeUrl(event.tags.transaction);
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // コンソールログのブレッドクラムは除外（デバッグ情報が誤って送信されてしまうのを防ぐため）
      if (breadcrumb.category === 'console') {
        return null;
      }

      // クリックや入力のブレッドクラムは除外する
      // 要素のaria-labelやtitleが記録され、カードの本文・ニックネーム・ボード名が送信されてしまうため
      if (breadcrumb.category?.startsWith('ui.')) {
        return null;
      }

      // HTTPリクエストのURLからクエリ文字列・ハッシュ・ルームIDを削除
      if ((breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') && typeof breadcrumb.data?.url === 'string') {
        breadcrumb.data.url = sanitizeUrl(breadcrumb.data.url);
      }

      // 画面遷移の履歴からルームIDと鍵を削除
      if (breadcrumb.category === 'navigation' && breadcrumb.data) {
        for (const key of ['from', 'to']) {
          if (typeof breadcrumb.data[key] === 'string') {
            breadcrumb.data[key] = sanitizeUrl(breadcrumb.data[key]);
          }
        }
      }

      return breadcrumb;
    },

    beforeSendTransaction(event) {
      // パフォーマンス監視のトランザクション名にはURLのパスが使われるため、ルームIDを削除する
      if (event.transaction) {
        event.transaction = sanitizeUrl(event.transaction);
      }
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }
      // 画面遷移などの計測区間にも、URLが説明やデータとして含まれる
      for (const span of event.spans ?? []) {
        if (span.description?.includes('/r/')) span.description = sanitizeUrl(span.description);
        for (const key of ['url', 'http.url', 'url.full']) {
          const value = span.data?.[key];
          if (typeof value === 'string') span.data[key] = sanitizeUrl(value);
        }
      }
      const traceData = event.contexts?.trace?.data;
      if (traceData) {
        for (const key of ['url', 'http.url', 'url.full']) {
          if (typeof traceData[key] === 'string') traceData[key] = sanitizeUrl(traceData[key]);
        }
      }
      return event;
    },

    integrations: [Sentry.browserTracingIntegration()],
  });
}

/**
 * エラーをSentryに送信
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}
