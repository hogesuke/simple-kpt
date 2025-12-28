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

  const { client, user } = result;

  const { name } = await parseRequestBody<{ name?: string }>(req);

  const trimmedName = (name ?? "").trim();
  if (!trimmedName) {
    return generateErrorResponse("name は必須です", 400);
  }

  const { data, error } = await client
    .from("boards")
    .insert({ name: trimmedName, owner_id: user.id })
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    console.error("[create-board] insert failed", error);
    return generateErrorResponse(error?.message ?? "unknown error", 500);
  }

  return generateJsonResponse({
    id: data.id,
    name: data.name,
  });
});
