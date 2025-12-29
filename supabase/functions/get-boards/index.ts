import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  // 自分がメンバーになっているボードのIDを取得
  const { data: memberData, error: memberError } = await client.from('board_members').select('board_id').eq('user_id', user.id);

  if (memberError) {
    return generateErrorResponse(memberError.message, 500);
  }

  const boardIds = (memberData ?? []).map((m: any) => m.board_id);

  if (boardIds.length === 0) {
    return generateJsonResponse([]);
  }

  // それらのボード情報を取得
  const { data, error } = await client
    .from('boards')
    .select('id, name, owner_id, created_at')
    .in('id', boardIds)
    .order('created_at', { ascending: false });

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse(data ?? []);
});
