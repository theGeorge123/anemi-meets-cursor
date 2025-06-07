import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleCreateNotification(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed." }),
      {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const { user_id, type, content, related_id } = await req.json();
    if (!user_id || !type || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("notifications").insert({
      user_id,
      type,
      content,
      related_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}

Deno.serve(handleCreateNotification); 