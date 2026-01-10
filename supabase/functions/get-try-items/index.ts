import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { ITEMS_PER_PAGE, VALID_TRY_STATUSES } from '../../../shared/constants.ts';
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

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || ITEMS_PER_PAGE, 100);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

  // ステータスパラメータをパース（カンマ区切り）
  const statusParam = getQueryParam(req, 'status');
  let statuses: string[] = [];

  if (statusParam) {
    statuses = statusParam.split(',').filter((s) => VALID_TRY_STATUSES.includes(s as (typeof VALID_TRY_STATUSES)[number]));
    if (statuses.length === 0) {
      return generateErrorResponse('無効なステータスが指定されました', 400);
    }
  }

  // ユーザーが所属するボードのIDを取得
  const { data: memberships, error: memberError } = await client.from('board_members').select('board_id').eq('user_id', user.id);

  if (memberError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  // 所属するボードがない場合は空配列を返す
  if (!memberships || memberships.length === 0) {
    return generateJsonResponse({ items: [], hasMore: false });
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

  // 期日が近い順にソート（NULLは末尾）、同一日付はcreated_at順
  query = query
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit); // NOTE: 1件多く取得してhasMoreの判定に用いる

  const { data, error } = await query;

  if (error) {
    return generateErrorResponse('Tryアイテムの取得に失敗しました', 500);
  }

  const allItems = data ?? [];
  const hasMore = allItems.length > limit;
  const resultItems = hasMore ? allItems.slice(0, limit) : allItems;

  const items = resultItems.map((item: any) => ({
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

  return generateJsonResponse({ items, hasMore });
});
