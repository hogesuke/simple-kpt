import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js";

/**
 * JSONレスポンスを生成する。
 */
export function generateJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * エラーレスポンスを生成する。
 */
export function generateErrorResponse(message: string, status = 500): Response {
  return generateJsonResponse({ error: message }, status);
}

/**
 * HTTPメソッドをチェックする。許可されていないメソッドの場合はエラーレスポンスを返す。
 */
export function requireMethod(req: Request, method: string): Response | null {
  if (req.method !== method) {
    return generateErrorResponse("Method Not Allowed", 405);
  }
  return null;
}

/**
 * リクエストボディをJSONとしてパースする。
 */
export async function parseRequestBody<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/**
 * 認証付きSupabaseクライアントとユーザーを作成する。
 * 環境変数や認証ヘッダーが不正な場合はエラーレスポンスを返す。
 */
export async function createAuthenticatedClient(
  req: Request,
): Promise<{ client: SupabaseClient; user: User } | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    return generateErrorResponse("問題が発生しています", 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return generateErrorResponse("認証が必要です", 401);
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return generateErrorResponse("認証に失敗しました", 401);
  }

  return { client, user };
}
