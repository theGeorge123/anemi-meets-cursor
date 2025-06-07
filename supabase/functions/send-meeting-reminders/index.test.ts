import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleReminders } from "./index.ts";

Deno.test("missing env vars", async () => {
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.delete("RESEND_API_KEY");
  const res = await handleReminders();
  assertEquals(res.status, 500);
});
