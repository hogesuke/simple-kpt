import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
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

  const { client } = result;

  const { boardId } = await parseRequestBody<{ boardId?: string }>(req);

  if (!boardId) {
    return generateErrorResponse("boardIdは必須です", 400);
  }

  const { data, error } = await client
    .from("items")
    .select("id, board_id, column_name, text, created_at")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse(data ?? []);
});
