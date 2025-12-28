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
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .maybeSingle();

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  if (!data) {
    return generateErrorResponse("ボードが見つかりません", 404);
  }

  return generateJsonResponse(data);
});
