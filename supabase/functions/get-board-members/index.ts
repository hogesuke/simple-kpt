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

  // ボードの存在確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ユーザーがメンバーか確認
  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  if (!member) {
    return generateErrorResponse('このボードへのアクセス権限がありません', 403);
  }

  // メンバー一覧を取得
  const { data: membersData, error: membersError } = await client
    .from('board_members')
    .select('id, user_id, role, created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });

  if (membersError) {
    return generateErrorResponse(membersError.message, 500);
  }

  // プロフィール情報を取得
  const userIds = (membersData ?? []).map((m: any) => m.user_id);
  const { data: profilesData } = await client.from('profiles').select('id, nickname').in('id', userIds);

  // プロフィール情報をマップに変換
  const profilesMap = new Map((profilesData ?? []).map((p: any) => [p.id, p.nickname]));

  const members = (membersData ?? []).map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    role: item.role,
    createdAt: item.created_at,
    nickname: profilesMap.get(item.user_id) ?? null,
  }));

  return generateJsonResponse(members);
});
