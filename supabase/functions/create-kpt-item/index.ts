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

  const { boardId, column, text } = payload as {
    boardId?: string;
    column?: string;
    text?: string;
  };

  if (!boardId || !column || !text) {
    return new Response(
      JSON.stringify({ error: "boardId, column, text は必須です" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      board_id: boardId,
      column_name: column,
      text,
    })
    .select("id, board_id, column_name, text")
    .maybeSingle();

  if (error || !data) {
    console.error("[create-kpt-item] insert failed", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      id: data.id,
      boardId: data.board_id,
      column: data.column_name,
      text: data.text,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
