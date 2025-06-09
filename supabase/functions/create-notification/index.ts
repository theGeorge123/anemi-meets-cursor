import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleCreateNotification(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

    // Require Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }
    const jwt = authHeader.replace("Bearer ", "");
    // Verify JWT via Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error: verifyError } = await supabase.auth.getUser(jwt);
    if (verifyError || !data?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }
    const userId = data.user.id;

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
    // Only allow notifications for yourself
    if (user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden: can only create notifications for yourself" }), { status: 403, headers: { "Access-Control-Allow-Origin": "*" } });
    }

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