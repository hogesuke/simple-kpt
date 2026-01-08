import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { BOARD_NAME_MAX_LENGTH } from '../../../shared/constants.ts';
import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'POST');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { name } = await parseRequestBody<{ name?: string }>(req);

  const trimmedName = (name ?? '').trim();
  if (!trimmedName) {
    return generateErrorResponse('name は必須です', 400);
  }

  if (trimmedName.length > BOARD_NAME_MAX_LENGTH) {
    return generateErrorResponse(`ボード名は${BOARD_NAME_MAX_LENGTH}文字以内で入力してください`, 400);
  }

  const { data, error } = await client.rpc('create_board_with_owner', {
    p_name: trimmedName,
    p_user_id: user.id,
  });

  if (error) {
    return generateErrorResponse('ボードの作成に失敗しました', 500);
  }

  if (!data) {
    return generateErrorResponse('ボードの作成に失敗しました', 500);
  }

  return generateJsonResponse(data);
});
