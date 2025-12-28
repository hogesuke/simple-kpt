import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
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
  const methodError = requireMethod(req, "POST");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { client } = result;

  const { id, boardId, column, text } = await parseRequestBody<UpdateKptItemBody>(req);

  if (!id || !boardId) {
    return generateErrorResponse("id, boardIdは必須です。", 400);
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
