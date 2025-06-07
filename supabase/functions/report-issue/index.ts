import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { log, logError } from "../_utils/logger.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    interface ReportBody {
      description: string;
      steps?: string;
      screenshot?: string | null;
      context?: unknown;
    }
    const body: ReportBody = await req.json();

    const { description, steps, screenshot, context } = body;
    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), { status: 400 });
    }

    log('Issue reported');

    return new Response(
      JSON.stringify({
        success: true,
        received: {
          description,
          steps,
          hasScreenshot: !!screenshot,
          context,
          receivedAt: new Date().toISOString(),
        }
      }),
      { status: 200 }
    );
  } catch (e) {
    logError(e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
  }
});
