import * as Sentry from '@sentry/react';

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

      // URLからクエリパラメータを削除（トークン等が含まれる可能性があるため）
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          url.search = '';
          event.request.url = url.toString();
        } catch {
          // NOOP
        }
      }

      // クエリ文字列を削除
      if (event.request?.query_string) {
        delete event.request.query_string;
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // コンソールログのブレッドクラムは除外（デバッグ情報が誤って送信されてしまうのを防ぐため）
      if (breadcrumb.category === 'console') {
        return null;
      }

      // HTTPリクエストのURLからクエリパラメータを削除
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          try {
            const url = new URL(breadcrumb.data.url);
            url.search = '';
            breadcrumb.data.url = url.toString();
          } catch {
            // NOOP
          }
        }
      }

      return breadcrumb;
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
