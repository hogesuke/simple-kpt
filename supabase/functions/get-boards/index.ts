import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  requireMethod,
} from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  const methodError = requireMethod(req, "GET");
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { data, error} = await client
    .from("boards")
    .select("id, name, owner_id, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  return generateJsonResponse(data ?? []);
});
