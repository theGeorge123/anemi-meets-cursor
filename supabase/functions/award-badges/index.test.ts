import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleAwardBadge } from "./index.ts";

Deno.test("missing authorization returns 401", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const res = await handleAwardBadge(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({})
  }));

  assertEquals(res.status, 401);
  const data = await res.json();
  assert(data.error.includes("Missing or invalid authorization"));
});

Deno.test("missing required fields returns 400", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string) => {
    if (typeof input === "string" && input.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };

  const res = await handleAwardBadge(new Request("http://localhost", {
    method: "POST",
    headers: { 
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  }));

  assertEquals(res.status, 400);
  const data = await res.json();
  assert(data.error.includes("Missing required fields"));

  globalThis.fetch = originalFetch;
});

Deno.test("invalid badge type returns 400", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string) => {
    if (typeof input === "string" && input.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };

  const res = await handleAwardBadge(new Request("http://localhost", {
    method: "POST",
    headers: { 
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: "auth-user",
      badge_type: "invalid_badge"
    })
  }));

  assertEquals(res.status, 400);
  const data = await res.json();
  assert(data.error.includes("Invalid badge type"));

  globalThis.fetch = originalFetch;
});

Deno.test("successful badge award", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string) => {
    if (typeof input === "string" && input.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200 });
    }
    if (typeof input === "string" && input.includes("/rest/v1/badges")) {
      return new Response("[]", { status: 200 }); // No existing badge
    }
    return new Response("{}", { status: 200 });
  };

  const res = await handleAwardBadge(new Request("http://localhost", {
    method: "POST",
    headers: { 
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: "auth-user",
      badge_type: "early_adopter"
    })
  }));

  assertEquals(res.status, 200);
  const data = await res.json();
  assert(data.success);
  assert(data.message.includes("successfully awarded"));

  globalThis.fetch = originalFetch;
});

Deno.test("duplicate badge award returns 409", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string) => {
    if (typeof input === "string" && input.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "auth-user" } }), { status: 200 });
    }
    if (typeof input === "string" && input.includes("/rest/v1/badges")) {
      return new Response("[{\"user_id\":\"auth-user\",\"badge_type\":\"early_adopter\"}]", { status: 200 }); // Existing badge
    }
    return new Response("{}", { status: 200 });
  };

  const res = await handleAwardBadge(new Request("http://localhost", {
    method: "POST",
    headers: { 
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: "auth-user",
      badge_type: "early_adopter"
    })
  }));

  assertEquals(res.status, 409);
  const data = await res.json();
  assert(data.error.includes("already has this badge"));

  globalThis.fetch = originalFetch;
}); 