import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const { name } = payload as { name?: string };

  const trimmedName = (name ?? "").trim();
  if (!trimmedName) {
    return new Response(
      JSON.stringify({ error: "name は必須です" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "問題が発生しています" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("boards")
    .insert({ name: trimmedName })
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    console.error("[create-board] insert failed", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      id: data.id,
      name: data.name,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
