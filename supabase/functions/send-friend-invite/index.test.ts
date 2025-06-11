import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleFriendInvite } from "./index.ts";

Deno.test("missing authorization returns 401", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");
  Deno.env.set("RESEND_API_KEY", "key");
  const res = await handleFriendInvite(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({})
  }));
  assertEquals(res.status, 401);
});

Deno.test("inviter mismatch returns 403", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");
  Deno.env.set("RESEND_API_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
    if (typeof input === "string" && input.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };

  const res = await handleFriendInvite(new Request("http://localhost", {
    method: "POST",
    headers: { "Authorization": "Bearer token", "Content-Type": "application/json" },
    body: JSON.stringify({ inviter_id: "other" })
  }));

  assertEquals(res.status, 403);
  globalThis.fetch = originalFetch;
});

Deno.test("invite email escapes html", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");
  Deno.env.set("RESEND_API_KEY", "key");

  let html = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/rest/v1/profiles")) {
      return new Response("[{\"fullName\":\"<b>Hacker</b>\",\"email\":\"hack@example.com\"}]", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/rest/v1/friend_invites")) {
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("resend.com")) {
      html = JSON.parse(init?.body as string).html;
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const res = await handleFriendInvite(new Request("http://localhost", {
    method: "POST",
    headers: { "Authorization": "Bearer token", "Content-Type": "application/json" },
    body: JSON.stringify({ invitee_email: "friend@example.com" })
  }));

  assertEquals(res.status, 200);
  assert(!html.includes("<b>Hacker</b>"));
  assert(html.includes("&lt;b&gt;Hacker&lt;/b&gt;"));
  globalThis.fetch = originalFetch;
});

