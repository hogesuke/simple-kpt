import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

type UpdateKptItemBody = {
  id?: string;
  boardId?: string;
  column?: string;
  text?: string;
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: "問題が発生しています" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: '認証が必要です' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: '認証に失敗しました' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: UpdateKptItemBody;
  try {
    body = (await req.json()) as UpdateKptItemBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, boardId, column, text } = body;

  if (!id || !boardId) {
    return new Response(JSON.stringify({ error: 'id, boardIdは必須です。' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updates: Record<string, unknown> = {};
  if (typeof column === 'string') {
    updates.column_name = column;
  }
  if (typeof text === 'string') {
    updates.text = text;
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: '更新内容が指定されていません。' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('board_id', boardId)
    .select('id, board_id, column_name, text')
    .maybeSingle();

  if (error || !data) {
    // TODO: エラーハンドリングを改善する
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

Deno.serve(handler);
