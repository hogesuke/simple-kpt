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

  const { id, boardId } = await parseRequestBody<{ id?: string; boardId?: string }>(req);

  if (!id || !boardId) {
    return generateErrorResponse("id, boardId は必須です", 400);
  }

  const { error } = await client.from("items").delete().eq("id", id).eq("board_id", boardId);

  if (error) {
    console.error("[delete-kpt-item] delete failed", error);
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse({ success: true });
});
