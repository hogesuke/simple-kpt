import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { ITEMS_PER_PAGE } from '../../../shared/constants.ts';
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

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || ITEMS_PER_PAGE, 100);
  const cursor = url.searchParams.get('cursor');

  // 自分がメンバーになっているボードのIDを取得
  const { data: memberData, error: memberError } = await client.from('board_members').select('board_id').eq('user_id', user.id);

  if (memberError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  const boardIds = (memberData ?? []).map((m: { board_id: string }) => m.board_id);

  if (boardIds.length === 0) {
    return generateJsonResponse({ items: [], nextCursor: null, hasMore: false });
  }

  // ボード情報を取得
  let query = client
    .from('boards')
    .select('id, name, owner_id, created_at')
    .in('id', boardIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // NOTE: 1件多く取得してhasMoreの判定に用いる

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  const items = data ?? [];
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && resultItems.length > 0 ? resultItems[resultItems.length - 1].created_at : null;

  return generateJsonResponse({ items: resultItems, nextCursor, hasMore });
});
