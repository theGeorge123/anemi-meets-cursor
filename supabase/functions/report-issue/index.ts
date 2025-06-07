import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  interface ReportBody {
    description: string;
    steps?: string;
    screenshot?: string | null;
    context?: unknown;
  }
  let body: ReportBody;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { description, steps, screenshot, context } = body;
  if (!description) {
    return new Response(JSON.stringify({ error: 'Description is required' }), { status: 400 });
  }

  // For MVP: just echo back the received data
  // In production: store in DB, send email/Slack, etc.
  return new Response(JSON.stringify({
    success: true,
    received: {
      description,
      steps,
      hasScreenshot: !!screenshot,
      context,
      receivedAt: new Date().toISOString(),
    }
  }), { status: 200 });
});
