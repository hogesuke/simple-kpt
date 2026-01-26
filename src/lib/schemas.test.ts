/* eslint-disable vitest/no-conditional-expect */
import { describe, expect, it } from 'vitest';

import {
  BOARD_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  ITEM_TEXT_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@shared/constants';

import {
  boardNameSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  itemTextSchema,
  nicknameSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './schemas';

describe('nicknameSchema', () => {
  it('有効なニックネームを受け入れること', () => {
    const result = nicknameSchema.safeParse({ nickname: 'テストユーザー' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe('テストユーザー');
    }
  });

  it('空文字を拒否すること', () => {
    const result = nicknameSchema.safeParse({ nickname: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ニックネームを入力してください');
    }
  });

  it('最大文字数を超える場合に拒否すること', () => {
    const longNickname = 'あ'.repeat(NICKNAME_MAX_LENGTH + 1);
    const result = nicknameSchema.safeParse({ nickname: longNickname });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(`${NICKNAME_MAX_LENGTH}文字以内で入力してください`);
    }
  });

  it('最大文字数ちょうどは受け入れること', () => {
    const maxNickname = 'あ'.repeat(NICKNAME_MAX_LENGTH);
    const result = nicknameSchema.safeParse({ nickname: maxNickname });
    expect(result.success).toBe(true);
  });

  it('前後の空白がtrimされること', () => {
    const result = nicknameSchema.safeParse({ nickname: '  テスト  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe('テスト');
    }
  });

  it('空白のみの場合はtrimされた空文字になること', () => {
    // 注: min(1)チェックはtrim前に行われるため、空白のみの入力は通過する
    // trimは出力変換として適用される
    const result = nicknameSchema.safeParse({ nickname: '   ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe('');
    }
  });
});

describe('boardNameSchema', () => {
  it('有効なボード名を受け入れること', () => {
    const result = boardNameSchema.safeParse({ name: '第1回振り返り' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('第1回振り返り');
    }
  });

  it('空文字を拒否すること', () => {
    const result = boardNameSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ボード名を入力してください');
    }
  });

  it('最大文字数を超える場合に拒否すること', () => {
    const longName = 'あ'.repeat(BOARD_NAME_MAX_LENGTH + 1);
    const result = boardNameSchema.safeParse({ name: longName });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(`${BOARD_NAME_MAX_LENGTH}文字以内で入力してください`);
    }
  });

  it('前後の空白がtrimされること', () => {
    const result = boardNameSchema.safeParse({ name: '  ボード名  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('ボード名');
    }
  });
});

describe('itemTextSchema', () => {
  it('有効なテキストを受け入れること', () => {
    const result = itemTextSchema.safeParse({ text: 'これはKeepです' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('これはKeepです');
    }
  });

  it('空文字を拒否すること', () => {
    const result = itemTextSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('テキストを入力してください');
    }
  });

  it('最大文字数を超える場合に拒否すること', () => {
    const longText = 'あ'.repeat(ITEM_TEXT_MAX_LENGTH + 1);
    const result = itemTextSchema.safeParse({ text: longText });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(`${ITEM_TEXT_MAX_LENGTH}文字以内で入力してください`);
    }
  });

  it('最大文字数ちょうどは受け入れること', () => {
    const maxText = 'あ'.repeat(ITEM_TEXT_MAX_LENGTH);
    const result = itemTextSchema.safeParse({ text: maxText });
    expect(result.success).toBe(true);
  });

  it('前後の空白がtrimされること', () => {
    const result = itemTextSchema.safeParse({ text: '  テスト  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('テスト');
    }
  });
});

describe('signInSchema', () => {
  it('有効なサインイン情報を受け入れること', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('無効なメールアドレスを拒否すること', () => {
    const result = signInSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
    }
  });

  it('空のメールアドレスを拒否すること', () => {
    const result = signInSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('空のパスワードを拒否すること', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードを入力してください');
    }
  });

  it('メールアドレスが最大文字数を超える場合に拒否すること', () => {
    const longEmail = 'a'.repeat(EMAIL_MAX_LENGTH) + '@example.com';
    const result = signInSchema.safeParse({
      email: longEmail,
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('パスワードが最大文字数を超える場合に拒否すること', () => {
    const longPassword = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: longPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('有効なサインアップ情報を受け入れること', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('パスワードが最小文字数未満の場合に拒否すること', () => {
    const shortPassword = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: shortPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(`パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
    }
  });

  it('パスワードが最小文字数ちょうどは受け入れること', () => {
    const minPassword = 'a'.repeat(PASSWORD_MIN_LENGTH);
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: minPassword,
    });
    expect(result.success).toBe(true);
  });

  it('パスワードが最大文字数を超える場合に拒否すること', () => {
    const longPassword = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: longPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('有効なメールアドレスを受け入れること', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('無効なメールアドレスを拒否すること', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'invalid-email',
    });
    expect(result.success).toBe(false);
  });

  it('空のメールアドレスを拒否すること', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('有効なパスワードリセット情報を受け入れること', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('パスワードが一致しない場合に拒否すること', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword123',
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((e) => e.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });

  it('確認用パスワードが空の場合に拒否すること', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword123',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((e) => e.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('確認用パスワードを入力してください');
    }
  });

  it('パスワードが最小文字数未満の場合に拒否すること', () => {
    const shortPassword = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = resetPasswordSchema.safeParse({
      password: shortPassword,
      confirmPassword: shortPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('有効なパスワード変更情報を受け入れること', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456',
    });
    expect(result.success).toBe(true);
  });

  it('現在のパスワードが空の場合に拒否すること', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const currentError = result.error.issues.find((e) => e.path.includes('currentPassword'));
      expect(currentError?.message).toBe('現在のパスワードを入力してください');
    }
  });

  it('新しいパスワードと確認用パスワードが一致しない場合に拒否すること', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456',
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((e) => e.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });

  it('新しいパスワードが現在のパスワードと同じ場合に拒否すること', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'samepassword123',
      newPassword: 'samepassword123',
      confirmPassword: 'samepassword123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const newPasswordError = result.error.issues.find((e) => e.path.includes('newPassword'));
      expect(newPasswordError?.message).toBe('現在のパスワードと同じパスワードは設定できません');
    }
  });

  it('新しいパスワードが最小文字数未満の場合に拒否すること', () => {
    const shortPassword = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword123',
      newPassword: shortPassword,
      confirmPassword: shortPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const newPasswordError = result.error.issues.find((e) => e.path.includes('newPassword'));
      expect(newPasswordError?.message).toBe(`新しいパスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`);
    }
  });

  it('確認用パスワードが空の場合に拒否すること', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((e) => e.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('確認用パスワードを入力してください');
    }
  });
});
