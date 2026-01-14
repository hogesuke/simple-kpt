import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js';

/**
 * PostgreSQLエラーコード
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODE = {
  UNIQUE_VIOLATION: '23505',
} as const;

/**
 * Service Roleキーを使ったSupabaseクライアントを作成する。
 * 全テーブルへのアクセスはこのクライアントを使用する。
 *
 * ## 注意
 * service_roleはRLSをバイパスするため、必ず認証とユーザーIDベースの権限チェックを行うこと。
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Service role credentials not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * CORSヘッダー
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
};

/**
 * JSONレスポンスを生成する。
 */
export function generateJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * エラーレスポンスを生成する。
 */
export function generateErrorResponse(message: string, status = 500): Response {
  return generateJsonResponse({ error: message }, status);
}

/**
 * CORS preflightリクエストを処理する。OPTIONSリクエストの場合は適切なレスポンスを返す。
 */
export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

/**
 * HTTPメソッドをチェックする。許可されていないメソッドの場合はエラーレスポンスを返す。
 */
export function requireMethod(req: Request, method: string): Response | null {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  if (req.method !== method) {
    return generateErrorResponse('Method Not Allowed', 405);
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
 * URLクエリパラメータを取得する。
 */
export function getQueryParam(req: Request, key: string): string | null {
  const url = new URL(req.url);
  return url.searchParams.get(key);
}

/**
 * UUID形式かどうか検証する。
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 認証付きSupabaseクライアントとユーザーを作成する。
 * 環境変数や認証ヘッダーが不正な場合はエラーレスポンスを返す。
 */
export async function createAuthenticatedClient(req: Request): Promise<{ client: SupabaseClient; user: User } | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    return generateErrorResponse('問題が発生しています', 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return generateErrorResponse('認証が必要です', 401);
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    return generateErrorResponse('認証に失敗しました', 401);
  }

  return { client, user };
}
