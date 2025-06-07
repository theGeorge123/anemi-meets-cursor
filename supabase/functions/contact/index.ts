import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { log, logError } from "../_utils/logger.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  try {
    interface ContactBody { name: string; email: string; message: string }
    const body: ContactBody = await req.json();

    const { name, email, message } = body;
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    log('Contact request', { name, email });

    return new Response(
      JSON.stringify({
        success: true,
        received: { name, email, message, receivedAt: new Date().toISOString() },
      }),
      { status: 200 },
    );
  } catch (e) {
    logError(e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
  }
});
