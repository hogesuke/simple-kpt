import { describe, expect, it } from 'vitest';

import { APIError } from './api-error';

describe('APIError', () => {
  describe('コンストラクタ', () => {
    it('メッセージを設定できること', () => {
      const error = new APIError('エラーメッセージ');

      expect(error.message).toBe('エラーメッセージ');
    });

    it('ステータスコードを設定できること', () => {
      const error = new APIError('エラーメッセージ', 500);

      expect(error.status).toBe(500);
    });

    it('ステータスコードが指定されない場合、undefinedになること', () => {
      const error = new APIError('エラーメッセージ');

      expect(error.status).toBeUndefined();
    });

    it('nameが"APIError"であること', () => {
      const error = new APIError('エラーメッセージ');

      expect(error.name).toBe('APIError');
    });
  });

  describe('Errorの継承', () => {
    it('Errorクラスを継承していること', () => {
      const error = new APIError('エラーメッセージ');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
    });

    it('スタックトレースが存在すること', () => {
      const error = new APIError('エラーメッセージ');

      expect(error.stack).toBeDefined();
    });
  });

  describe('HTTPステータスコード', () => {
    it('400 Bad Requestを設定できること', () => {
      const error = new APIError('不正なリクエスト', 400);

      expect(error.status).toBe(400);
    });

    it('401 Unauthorizedを設定できること', () => {
      const error = new APIError('認証が必要です', 401);

      expect(error.status).toBe(401);
    });

    it('403 Forbiddenを設定できること', () => {
      const error = new APIError('アクセスが禁止されています', 403);

      expect(error.status).toBe(403);
    });

    it('404 Not Foundを設定できること', () => {
      const error = new APIError('リソースが見つかりません', 404);

      expect(error.status).toBe(404);
    });

    it('500 Internal Server Errorを設定できること', () => {
      const error = new APIError('サーバーエラー', 500);

      expect(error.status).toBe(500);
    });
  });
});
