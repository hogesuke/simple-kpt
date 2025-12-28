import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
  generateErrorResponse,
  generateJsonResponse,
  requireMethod,
} from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { client } = result;

  const { data, error } = await client
    .from("boards")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse(data ?? []);
});
