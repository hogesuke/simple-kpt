import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'PATCH');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { nickname } = await parseRequestBody<{ nickname?: string }>(req);

  if (!nickname || !nickname.trim()) {
    return generateErrorResponse('nicknameは必須です', 400);
  }

  const trimmedNickname = nickname.trim();

  // プロフィールが存在するか確認
  const { data: existing } = await client.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (existing) {
    // 既存のプロフィールを更新
    const { data, error } = await client
      .from('profiles')
      .update({ nickname: trimmedNickname })
      .eq('id', user.id)
      .select('id, nickname, created_at, updated_at')
      .maybeSingle();

    if (error || !data) {
      return generateErrorResponse(error?.message ?? 'unknown error', 500);
    }

    return generateJsonResponse(data);
  } else {
    // 新規プロフィールを作成
    const { data, error } = await client
      .from('profiles')
      .insert({ id: user.id, nickname: trimmedNickname })
      .select('id, nickname, created_at, updated_at')
      .maybeSingle();

    if (error || !data) {
      return generateErrorResponse(error?.message ?? 'unknown error', 500);
    }

    return generateJsonResponse(data);
  }
});
