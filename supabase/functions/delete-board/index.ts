import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  isValidUUID,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'DELETE');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const serviceClient = createServiceClient();

  const { boardId } = await parseRequestBody<{ boardId: string }>(req);

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
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
    return generateErrorResponse('このボードを削除する権限がありません', 403);
  }

  const { error: deleteError } = await serviceClient.from('boards').delete().eq('id', boardId);

  if (deleteError) {
    return generateErrorResponse('ボードの削除に失敗しました', 500);
  }

  return generateJsonResponse({ success: true, message: 'ボードを削除しました' });
});
