import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://deno.land/std@0.203.0/uuid/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // LET OP: email_a!
    const { email_a, selected_date, selected_time, cafe_name, cafe_address } = await req.json();
    if (!email_a || !selected_date || !selected_time || !cafe_name || !cafe_address) {
      throw new Error("Missing required fields");
    }

    const token = crypto.randomUUID ? crypto.randomUUID() : uuidv4.generate();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("invitations")
      .insert([{
        token,
        email_a,
        selected_date,
        selected_time,
        cafe_name,
        cafe_address,
        status: "pending"
      }])
      .select()
      .single();

    if (error || !data) {
      throw new Error("Could not create invitation: " + (error?.message || 'Unknown error'));
    }

    return new Response(JSON.stringify({ success: true, invitation: data }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}); 