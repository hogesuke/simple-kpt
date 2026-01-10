import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  isValidUUID,
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

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  const { data: board, error: boardError } = await client.from('boards').select('id, name, owner_id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  const isMember = !!member;

  // 非メンバーにはボード名とオーナー情報を隠す
  return generateJsonResponse({
    id: board.id,
    name: isMember ? board.name : null,
    owner_id: isMember ? board.owner_id : null,
    isMember,
  });
});
