import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleDeleteAccount } from "./index.ts";

Deno.test("continues deletion when farewell email fails", async () => {
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set("RESEND_API_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/auth/v1/user")) {
      return new Response(
        JSON.stringify({ user: { id: "uid", email: "user@example.com" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/rest/v1/profiles") && (!init || init.method === "GET")) {
      return new Response(
        JSON.stringify({ preferred_language: "en", fullName: "Test User" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/auth/v1/admin/users") && init?.method === "DELETE") {
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/rest/v1/profiles") && init?.method === "DELETE") {
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("resend.com")) {
      return new Response("Email error", { status: 500 });
    }
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: "Bearer token" },
  });
  const res = await handleDeleteAccount(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assert(body.success);

  globalThis.fetch = originalFetch;
});
