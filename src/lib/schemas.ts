import { TFunction } from 'i18next';
import { z } from 'zod';

import {
  BOARD_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  ITEM_TEXT_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@shared/constants';

// ファクトリパターン: 翻訳関数を受け取ってスキーマを生成

export const createNicknameSchema = (t: TFunction) =>
  z.object({
    nickname: z
      .string()
      .min(1, t('validation:ニックネームを入力してください'))
      .max(NICKNAME_MAX_LENGTH, t('validation:ニックネームは{{max}}文字以内で入力してください', { max: NICKNAME_MAX_LENGTH }))
      .transform((v) => v.trim()),
  });

export const createBoardNameSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t('validation:ボード名を入力してください'))
      .max(BOARD_NAME_MAX_LENGTH, t('validation:ボード名は{{max}}文字以内で入力してください', { max: BOARD_NAME_MAX_LENGTH }))
      .transform((v) => v.trim()),
  });

export const createItemTextSchema = (t: TFunction) =>
  z.object({
    text: z
      .string()
      .min(1, t('validation:テキストを入力してください'))
      .max(ITEM_TEXT_MAX_LENGTH, t('validation:テキストは{{max}}文字以内で入力してください', { max: ITEM_TEXT_MAX_LENGTH }))
      .transform((v) => v.trim()),
  });

// 認証用スキーマファクトリ
const createEmailSchema = (t: TFunction) =>
  z
    .string()
    .min(1, t('validation:メールアドレスを入力してください'))
    .email(t('validation:有効なメールアドレスを入力してください'))
    .max(EMAIL_MAX_LENGTH, t('validation:メールアドレスは{{max}}文字以内で入力してください', { max: EMAIL_MAX_LENGTH }));

export const createSignInSchema = (t: TFunction) =>
  z.object({
    email: createEmailSchema(t),
    password: z
      .string()
      .min(1, t('validation:パスワードを入力してください'))
      .max(PASSWORD_MAX_LENGTH, t('validation:パスワードは{{max}}文字以内で入力してください', { max: PASSWORD_MAX_LENGTH })),
  });

export const createSignUpSchema = (t: TFunction) =>
  z.object({
    email: createEmailSchema(t),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, t('validation:パスワードは{{min}}文字以上で入力してください', { min: PASSWORD_MIN_LENGTH }))
      .max(PASSWORD_MAX_LENGTH, t('validation:パスワードは{{max}}文字以内で入力してください', { max: PASSWORD_MAX_LENGTH })),
  });

export const createForgotPasswordSchema = (t: TFunction) =>
  z.object({
    email: createEmailSchema(t),
  });

export const createResetPasswordSchema = (t: TFunction) =>
  z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('validation:パスワードは{{min}}文字以上で入力してください', { min: PASSWORD_MIN_LENGTH }))
        .max(PASSWORD_MAX_LENGTH, t('validation:パスワードは{{max}}文字以内で入力してください', { max: PASSWORD_MAX_LENGTH })),
      confirmPassword: z.string().min(1, t('validation:確認用パスワードを入力してください')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation:パスワードが一致しません'),
      path: ['confirmPassword'],
    });

export const createChangePasswordSchema = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t('validation:現在のパスワードを入力してください')),
      newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('validation:パスワードは{{min}}文字以上で入力してください', { min: PASSWORD_MIN_LENGTH }))
        .max(PASSWORD_MAX_LENGTH, t('validation:パスワードは{{max}}文字以内で入力してください', { max: PASSWORD_MAX_LENGTH })),
      confirmPassword: z.string().min(1, t('validation:確認用パスワードを入力してください')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation:パスワードが一致しません'),
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t('validation:現在のパスワードと同じパスワードは設定できません'),
      path: ['newPassword'],
    });

// 型定義（静的に取得するためにダミースキーマを使用）
// 名前空間プレフィックスを除去し、補間を処理して返す
const dummyT = ((key: string, params?: Record<string, unknown>) => {
  const colonIndex = key.indexOf(':');
  let result = colonIndex !== -1 ? key.slice(colonIndex + 1) : key;
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(`{{${paramKey}}}`, String(value));
    });
  }
  return result;
}) as TFunction;
export type NicknameFormData = z.infer<ReturnType<typeof createNicknameSchema>>;
export type BoardNameFormData = z.infer<ReturnType<typeof createBoardNameSchema>>;
export type ItemTextFormData = z.infer<ReturnType<typeof createItemTextSchema>>;
export type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;

// 後方互換性のための静的スキーマ（移行期間中に使用）
export const nicknameSchema = createNicknameSchema(dummyT);
export const boardNameSchema = createBoardNameSchema(dummyT);
export const itemTextSchema = createItemTextSchema(dummyT);
export const signInSchema = createSignInSchema(dummyT);
export const signUpSchema = createSignUpSchema(dummyT);
export const forgotPasswordSchema = createForgotPasswordSchema(dummyT);
export const resetPasswordSchema = createResetPasswordSchema(dummyT);
export const changePasswordSchema = createChangePasswordSchema(dummyT);
