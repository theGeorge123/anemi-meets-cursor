import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleConfirmation } from "./index.ts";

Deno.test("returns 405 on wrong method", async () => {
  const res = await handleConfirmation(
    new Request("http://localhost", { method: "GET" }),
  );
  assertEquals(res.status, 405);
});

Deno.test("missing env vars return 500", async () => {
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.delete("RESEND_API_KEY");
  const res = await handleConfirmation(
    new Request("http://localhost", { method: "POST", body: "{}" }),
  );
  assertEquals(res.status, 500);
});
