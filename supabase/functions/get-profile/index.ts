import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { data, error } = await client.from('profiles').select('id, nickname, created_at, updated_at').eq('id', user.id).maybeSingle();

  if (error) {
    return generateErrorResponse(error.message, 500);
  }

  // プロフィールが存在しない場合はnullを返す
  return generateJsonResponse(data);
});
