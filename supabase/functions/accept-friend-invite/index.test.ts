import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleAcceptFriendInvite } from './index.ts';

Deno.test('accepts invite with valid token and email', async () => {
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set('SUPABASE_URL', 'https://example.supabase.co');
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'key');

  // Mock fetch for Supabase client
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url.includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ user: { id: 'user-b', email: 'friend@example.com' } }), {
        status: 200,
      });
    }
    if (url.includes('/rest/v1/friend_invites')) {
      return new Response(
        JSON.stringify([
          {
            id: 'invite-1',
            inviter_id: 'user-a',
            status: 'pending',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/rest/v1/rpc/accept_friend_invite')) {
      return new Response(
        JSON.stringify({
          success: true,
          friendship_created: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer dummy-token',
    },
    body: JSON.stringify({ token: 'dummy-token', email: 'friend@example.com' }),
  });
  const res = await handleAcceptFriendInvite(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.friendship_created, true);

  globalThis.fetch = originalFetch;
});

Deno.test('rejects expired invite', async () => {
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set('SUPABASE_URL', 'https://example.supabase.co');
  // @ts-expect-error Deno global is available in Deno tests
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'key');

  // Mock fetch for Supabase client
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url.includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ user: { id: 'user-b', email: 'friend@example.com' } }), {
        status: 200,
      });
    }
    if (url.includes('/rest/v1/friend_invites')) {
      return new Response(
        JSON.stringify([
          {
            id: 'invite-1',
            inviter_id: 'user-a',
            status: 'pending',
            expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer dummy-token',
    },
    body: JSON.stringify({ token: 'dummy-token', email: 'friend@example.com' }),
  });
  const res = await handleAcceptFriendInvite(req);
  assertEquals(res.status, 404);
  const body = await res.json();
  assertEquals(body.error, 'Invalid or expired invite token');

  globalThis.fetch = originalFetch;
});
