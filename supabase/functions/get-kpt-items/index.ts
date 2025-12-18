import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "環境変数の設定に問題があります" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("items")
    .select("id, column_name, text, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[get-kpt-items] select failed", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const items =
    data?.map((row) => ({
      id: row.id,
      column: row.column_name,
      text: row.text,
    })) ?? [];

  return new Response(
    JSON.stringify(items),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
