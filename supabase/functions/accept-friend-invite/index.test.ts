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
    if (url.includes('/rest/v1/friend_invites')) {
      if (init && init.method === 'GET') {
        // Simulate finding a valid invite
        return new Response(
          JSON.stringify({
            id: 'invite-1',
            inviter_id: 'user-a',
            invitee_email: 'friend@example.com',
            accepted: false,
            accepted_at: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (init && init.method === 'PATCH') {
        // Simulate successful update
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    if (url.includes('/rest/v1/profiles')) {
      // Simulate invitee is a registered user
      return new Response(JSON.stringify({ id: 'user-b', email: 'friend@example.com' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/rest/v1/friendships')) {
      // Simulate upsert
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'dummy-token', invitee_email: 'friend@example.com' }),
  });
  const res = await handleAcceptFriendInvite(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.friendship_created, true);

  globalThis.fetch = originalFetch;
});
