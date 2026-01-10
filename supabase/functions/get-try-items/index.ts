import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  requireMethod,
} from '../_shared/helpers.ts';

const VALID_STATUSES = ['pending', 'in_progress', 'done', 'wont_fix'];

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  // ステータスパラメータをパース（カンマ区切り）
  const statusParam = getQueryParam(req, 'status');
  let statuses: string[] = [];

  if (statusParam) {
    statuses = statusParam.split(',').filter((s) => VALID_STATUSES.includes(s));
    if (statuses.length === 0) {
      return generateErrorResponse('無効なステータスが指定されました', 400);
    }
  }

  // ユーザーが所属するボードのIDを取得
  const { data: memberships, error: memberError } = await client.from('board_members').select('board_id').eq('user_id', user.id);

  if (memberError) {
    return generateErrorResponse(memberError.message, 500);
  }

  // 所属するボードがない場合は空配列を返す
  if (!memberships || memberships.length === 0) {
    return generateJsonResponse([]);
  }

  const boardIds = memberships.map((m) => m.board_id);

  // Tryアイテムを取得
  let query = client
    .from('items')
    .select(
      `
      id,
      board_id,
      column_name,
      text,
      position,
      created_at,
      updated_at,
      author_id,
      status,
      assignee_id,
      due_date,
      profiles!items_author_id_profiles_fkey (
        nickname
      ),
      assignee:profiles!items_assignee_id_fkey (
        nickname
      ),
      boards (
        name
      )
    `
    )
    .eq('column_name', 'try')
    .in('board_id', boardIds);

  // ステータスフィルタが指定されている場合
  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }

  // 期日が近い順にソート（NULLは末尾）
  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  const items = (data ?? []).map((item: any) => ({
    id: item.id,
    board_id: item.board_id,
    board_name: item.boards?.name ?? null,
    column_name: item.column_name,
    text: item.text,
    position: item.position,
    created_at: item.created_at,
    updated_at: item.updated_at,
    author_id: item.author_id,
    author_nickname: item.profiles?.nickname ?? null,
    status: item.status,
    assignee_id: item.assignee_id,
    assignee_nickname: item.assignee?.nickname ?? null,
    due_date: item.due_date,
  }));

  return generateJsonResponse(items);
});
