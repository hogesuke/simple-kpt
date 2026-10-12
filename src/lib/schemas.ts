import { z } from 'zod';

// CSP(script-src 'self')環境でZod v4のJITコンパイル(new Function)によるCSP違反を防止
// https://github.com/colinhacks/zod/issues/4273
z.config({ jitless: true });

import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

export const itemTextSchema = z.object({
  text: z
    .string()
    .min(1, { message: 'validation:テキストを入力してください' })
    .max(ITEM_TEXT_MAX_LENGTH, { message: 'validation:{{max}}文字以内で入力してください' })
    .transform((v) => v.trim()),
});

export type ItemTextFormData = z.infer<typeof itemTextSchema>;
