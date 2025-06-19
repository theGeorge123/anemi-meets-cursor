import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleCreateNotification } from "./index.ts";

Deno.test("missing authorization returns 401", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");

  const res = await handleCreateNotification(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({})
  }));

  assertEquals(res.status, 401);
  const data = await res.json();
  assert(data.error.includes("Missing or invalid authorization"));
});

Deno.test("invalid method returns 405", async () => {
  const res = await handleCreateNotification(new Request("http://localhost", {
    method: "GET"
  }));

  assertEquals(res.status, 405);
  const data = await res.json();
  assert(data.error.includes("Method not allowed"));
});

Deno.test("missing required fields returns 400", async () => {
  const mockJwt = "valid.jwt.token";
  const res = await handleCreateNotification(new Request("http://localhost", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mockJwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  }));

  assertEquals(res.status, 400);
  const data = await res.json();
  assert(data.error.includes("Missing required fields"));
});

Deno.test("creates notification successfully", async () => {
  const mockJwt = "valid.jwt.token";
  const mockUserId = "user-123";
  const mockNotification = {
    type: "friend_request",
    title: "New Friend Request",
    message: "Someone wants to be your friend!",
    recipient_id: mockUserId,
    link: "/friends"
  };

  // Mock Supabase client
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    
    if (url.includes("/rest/v1/notifications")) {
      return new Response(JSON.stringify([{ id: "notif-123", ...mockNotification }]), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ id: mockUserId }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(null, { status: 404 });
  };

  const res = await handleCreateNotification(new Request("http://localhost", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mockJwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mockNotification)
  }));

  assertEquals(res.status, 201);
  const data = await res.json();
  assertEquals(data.id, "notif-123");
  assertEquals(data.type, mockNotification.type);
  assertEquals(data.title, mockNotification.title);

  // Restore original fetch
  globalThis.fetch = originalFetch;
});

Deno.test("handles database error gracefully", async () => {
  const mockJwt = "valid.jwt.token";
  const mockUserId = "user-123";
  const mockNotification = {
    type: "friend_request",
    title: "New Friend Request",
    message: "Someone wants to be your friend!",
    recipient_id: mockUserId,
    link: "/friends"
  };

  // Mock Supabase client to simulate database error
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    
    if (url.includes("/rest/v1/notifications")) {
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ id: mockUserId }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(null, { status: 404 });
  };

  const res = await handleCreateNotification(new Request("http://localhost", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mockJwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mockNotification)
  }));

  assertEquals(res.status, 500);
  const data = await res.json();
  assert(data.error.includes("Failed to create notification"));

  // Restore original fetch
  globalThis.fetch = originalFetch;
}); 