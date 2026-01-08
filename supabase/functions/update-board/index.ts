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

interface UpdateBoardBody {
  boardId: string;
  name: string;
}

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'PATCH');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const serviceClient = createServiceClient();

  const { boardId, name } = await parseRequestBody<UpdateBoardBody>(req);

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  const trimmedName = name?.trim();
  if (!trimmedName) {
    return generateErrorResponse('nameは必須です', 400);
  }

  if (trimmedName.length > BOARD_NAME_MAX_LENGTH) {
    return generateErrorResponse(`ボード名は${BOARD_NAME_MAX_LENGTH}文字以内で入力してください`, 400);
  }

  const { data: board, error: boardError } = await serviceClient.from('boards').select('id, owner_id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ボードのownerであるか確認する
  if (board.owner_id !== user.id) {
    return generateErrorResponse('このボードを編集する権限がありません', 403);
  }

  const { data: updatedBoard, error: updateError } = await serviceClient
    .from('boards')
    .update({ name: trimmedName })
    .eq('id', boardId)
    .select('id, name, owner_id, created_at')
    .single();

  if (updateError) {
    return generateErrorResponse('ボード名の更新に失敗しました', 500);
  }

  return generateJsonResponse(updatedBoard);
});
