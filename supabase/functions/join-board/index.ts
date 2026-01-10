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
  const methodError = requireMethod(req, 'POST');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { boardId } = await parseRequestBody<{ boardId?: string }>(req);

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ボードが存在するか確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // すでにメンバーかチェック
  const { data: existingMember } = await client
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return generateJsonResponse({ success: true, alreadyMember: true });
  }

  // メンバーとして追加
  const { error: insertError } = await client.from('board_members').insert({ board_id: boardId, user_id: user.id, role: 'member' });

  if (insertError) {
    return generateErrorResponse(insertError.message, 500);
  }

  return generateJsonResponse({ success: true, alreadyMember: false });
});
