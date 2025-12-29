import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  parseRequestBody,
  requireMethod,
} from "../_shared/helpers.ts";

type UpdateKptItemBody = {
  id?: string;
  boardId?: string;
  column?: string;
  text?: string;
};

Deno.serve(async (req) => {
  const methodError = requireMethod(req, "PATCH");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { id, boardId, column, text } = await parseRequestBody<UpdateKptItemBody>(req);

  if (!id || !boardId) {
    return generateErrorResponse("id, boardIdは必須です。", 400);
  }

  // boardの所有者チェック
  const { data: board, error: boardError } = await client
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (boardError) {
    console.error("[update-kpt-item] board check failed", boardError);
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse("ボードが見つかりません", 404);
  }

  const updates: Record<string, unknown> = {};
  if (typeof column === "string") {
    updates.column_name = column;
  }
  if (typeof text === "string") {
    updates.text = text;
  }

  if (Object.keys(updates).length === 0) {
    return generateErrorResponse("更新内容が指定されていません。", 400);
  }

  const { data, error } = await client
    .from("items")
    .update(updates)
    .eq("id", id)
    .eq("board_id", boardId)
    .select("id, board_id, column_name, text")
    .maybeSingle();

  if (error || !data) {
    return generateErrorResponse(error?.message ?? "Unknown error", 500);
  }

  return generateJsonResponse(data);
});
