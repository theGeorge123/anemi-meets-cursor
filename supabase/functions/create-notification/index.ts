import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from '../../../src/types/supabase.ts';
import { AppError, ERROR_CODES, handleError, createErrorResponse, validateEnvVars } from "../utils.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function handleCreateNotification(req: Request): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    if (req.method !== "POST") {
      throw new AppError(
        "Only POST requests allowed",
        ERROR_CODES.INVALID_REQUEST,
        405
      );
    }

    // Validate required environment variables
    validateEnvVars(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Missing or invalid authorization header",
        ERROR_CODES.UNAUTHORIZED,
        401
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    
    // Verify JWT via Supabase
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error: verifyError } = await supabase.auth.getUser(jwt);
    
    if (verifyError || !data?.user) {
      throw new AppError(
        "Invalid authentication token",
        ERROR_CODES.UNAUTHORIZED,
        401,
        verifyError
      );
    }
    
    const userId = data.user.id;

    // Parse and validate request body
    const { user_id, type, content, related_id } = await req.json().catch(() => {
      throw new AppError(
        "Invalid JSON payload",
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    });

    if (!user_id || !type || !content) {
      throw new AppError(
        "Missing required fields: user_id, type, content",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Only allow notifications for yourself
    if (user_id !== userId) {
      throw new AppError(
        "Forbidden: can only create notifications for yourself",
        ERROR_CODES.FORBIDDEN,
        403
      );
    }

    // Create notification
    const { error: insertError } = await supabase.from("notifications").insert({
      user_id,
      type,
      content,
      related_id,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new AppError(
        "Failed to create notification",
        ERROR_CODES.DATABASE_ERROR,
        500,
        insertError
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Notification created successfully"
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return createErrorResponse(errorResponse, CORS_HEADERS);
  }
}

Deno.serve(handleCreateNotification); 