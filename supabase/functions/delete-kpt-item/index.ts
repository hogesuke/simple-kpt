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
  const methodError = requireMethod(req, "DELETE");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { id, boardId } = await parseRequestBody<{ id?: string; boardId?: string }>(req);

  if (!id || !boardId) {
    return generateErrorResponse("id, boardId は必須です", 400);
  }

  // boardの所有者チェック
  const { data: board, error: boardError } = await client
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (boardError) {
    console.error("[delete-kpt-item] board check failed", boardError);
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse("ボードが見つかりません", 404);
  }

  const { error } = await client.from("items").delete().eq("id", id).eq("board_id", boardId);

  if (error) {
    console.error("[delete-kpt-item] delete failed", error);
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse({ success: true });
});
