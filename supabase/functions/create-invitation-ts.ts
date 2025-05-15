import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { email_a, selected_date, selected_time, cafe_name, cafe_address } = await req.json();
    if (!email_a || !selected_date || !selected_time || !cafe_name || !cafe_address) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    // Token genereren
    const token = crypto.randomUUID();
    const { data, error } = await supabaseClient.from('invitations').insert([
      {
        token,
        email_a,
        selected_date,
        selected_time,
        cafe_name,
        cafe_address,
        status: 'pending'
      }
    ]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ message: 'Invitation created', data }), {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 