import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    return new Response(
      JSON.stringify({ error: "問題が発生しています" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "認証が必要です" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "認証に失敗しました" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { boardId } = payload as {
    boardId?: string;
  };

  if (!boardId) {
    return new Response(
      JSON.stringify({ error: "boardIdは必須です" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data, error } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: "ボードが見つかりません" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
