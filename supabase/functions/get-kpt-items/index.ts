import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  requireMethod,
} from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  const methodError = requireMethod(req, "GET");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const boardId = getQueryParam(req, "boardId");

  if (!boardId) {
    return generateErrorResponse("boardIdは必須です", 400);
  }

  // boardの所有者チェック
  const { data: board, error: boardError } = await client
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (boardError) {
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse("ボードが見つかりません", 404);
  }

  const { data, error } = await client
    .from("items")
    .select(`
      id,
      board_id,
      column_name,
      text,
      created_at,
      author_id,
      profiles!items_author_id_profiles_fkey (
        nickname
      )
    `)
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  // ニックネーム情報をフラットな構造に変換
  const items = (data ?? []).map((item: any) => ({
    id: item.id,
    board_id: item.board_id,
    column_name: item.column_name,
    text: item.text,
    created_at: item.created_at,
    author_id: item.author_id,
    author_nickname: item.profiles?.nickname ?? null,
  }));

  return generateJsonResponse(items);
});
