import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  parseRequestBody,
  requireMethod,
} from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { boardId, column, text } = await parseRequestBody<{
    boardId?: string;
    column?: string;
    text?: string;
  }>(req);

  if (!boardId || !column || !text) {
    return generateErrorResponse("boardId, column, text は必須です", 400);
  }

  // boardの所有者チェック
  const { data: board, error: boardError } = await client
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (boardError) {
    console.error("[create-kpt-item] board check failed", boardError);
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse("ボードが見つかりません", 404);
  }

  const { data, error } = await client
    .from("items")
    .insert({
      board_id: boardId,
      column_name: column,
      text,
      author_id: user.id,
    })
    .select(`
      id,
      board_id,
      column_name,
      text,
      author_id,
      profiles!items_author_id_profiles_fkey (
        nickname
      )
    `)
    .maybeSingle();

  if (error || !data) {
    console.error("[create-kpt-item] insert failed", error);
    return generateErrorResponse(error?.message ?? "unknown error", 500);
  }

  return generateJsonResponse({
    id: data.id,
    boardId: data.board_id,
    column: data.column_name,
    text: data.text,
    authorId: data.author_id,
    authorNickname: (data.profiles as any)?.nickname ?? null,
  });
});
