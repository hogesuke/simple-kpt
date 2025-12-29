import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const boardId = getQueryParam(req, 'boardId');

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  // boardが存在するか確認
  const { data: board, error: boardError } = await client.from('boards').select('id, name').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ユーザーがboard_membersに含まれているかチェック
  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  return generateJsonResponse({
    ...board,
    isMember: !!member,
  });
});
