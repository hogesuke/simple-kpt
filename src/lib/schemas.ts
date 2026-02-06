import { z } from 'zod';

import {
  BOARD_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  ITEM_TEXT_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@shared/constants';

export const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, { message: 'validation:ニックネームを入力してください' })
    .max(NICKNAME_MAX_LENGTH, { message: 'validation:{{max}}文字以内で入力してください' })
    .transform((v) => v.trim()),
});

export const boardNameSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'validation:ボード名を入力してください' })
    .max(BOARD_NAME_MAX_LENGTH, { message: 'validation:{{max}}文字以内で入力してください' })
    .transform((v) => v.trim()),
});

export const itemTextSchema = z.object({
  text: z
    .string()
    .min(1, { message: 'validation:テキストを入力してください' })
    .max(ITEM_TEXT_MAX_LENGTH, { message: 'validation:{{max}}文字以内で入力してください' })
    .transform((v) => v.trim()),
});

export type NicknameFormData = z.infer<typeof nicknameSchema>;
export type BoardNameFormData = z.infer<typeof boardNameSchema>;
export type ItemTextFormData = z.infer<typeof itemTextSchema>;

// 認証用スキーマ
const emailSchema = z
  .string()
  .min(1, { message: 'validation:メールアドレスを入力してください' })
  .email({ message: 'validation:有効なメールアドレスを入力してください' })
  .max(EMAIL_MAX_LENGTH, { message: 'validation:メールアドレスは{{max}}文字以内で入力してください' });

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { message: 'validation:パスワードを入力してください' })
    .max(PASSWORD_MAX_LENGTH, { message: 'validation:パスワードは{{max}}文字以内で入力してください' }),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: 'validation:パスワードは{{min}}文字以上で入力してください' })
    .max(PASSWORD_MAX_LENGTH, { message: 'validation:パスワードは{{max}}文字以内で入力してください' }),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'validation:利用規約への同意が必要です',
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: 'validation:パスワードは{{min}}文字以上で入力してください' })
      .max(PASSWORD_MAX_LENGTH, { message: 'validation:パスワードは{{max}}文字以内で入力してください' }),
    confirmPassword: z.string().min(1, { message: 'validation:確認用パスワードを入力してください' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation:パスワードが一致しません',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'validation:現在のパスワードを入力してください' }),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: 'validation:新しいパスワードは{{min}}文字以上で入力してください' })
      .max(PASSWORD_MAX_LENGTH, { message: 'validation:新しいパスワードは{{max}}文字以内で入力してください' }),
    confirmPassword: z.string().min(1, { message: 'validation:確認用パスワードを入力してください' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation:パスワードが一致しません',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'validation:現在のパスワードと同じパスワードは設定できません',
    path: ['newPassword'],
  });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
