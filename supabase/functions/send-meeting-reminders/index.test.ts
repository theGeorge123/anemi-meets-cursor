/// <reference lib="deno.ns" />
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// deno-lint-ignore no-explicit-any
(Deno as any).cron = () => {};

const { handleReminders } = await import("./index.ts");

// Track intervals for cleanup
const intervals: number[] = [];
const originalSetInterval = globalThis.setInterval;
globalThis.setInterval = (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  // deno-lint-ignore no-explicit-any
  const id = (originalSetInterval as any)(handler, timeout, ...args);
  intervals.push(id);
  return id;
};

Deno.test("missing env vars", async () => {
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.delete("RESEND_API_KEY");
  const res = await handleReminders();
  assertEquals(res.status, 500);
});

Deno.test("reminder email escapes html", async () => {
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "key");
  Deno.env.set("RESEND_API_KEY", "key");

  let html = "";
  const originalFetch = globalThis.fetch;

  const fixedDate = new Date("2024-01-01T06:00:00Z");
  const RealDate = Date;
  type DateArgs = (number | string | Date)[];
  class FakeDate extends RealDate {
    constructor(...args: DateArgs) {
      super(...args);
      if (args.length === 0) {
        Object.setPrototypeOf(this, FakeDate.prototype);
        // deno-lint-ignore no-explicit-any
        return new RealDate(fixedDate) as any;
      }
    }
    static override now() {
      return fixedDate.getTime();
    }
  }
  // deno-lint-ignore no-explicit-any
  (globalThis as any).Date = FakeDate;

  globalThis.fetch = (input: Request | URL | string, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/invitations") && (!init || init.method === "GET")) {
      const data = [{ id: 1, token: "tok", email_a: "a@example.com", email_b: "b@example.com", selected_date: "2024-01-02", selected_time: "morning", cafe_id: 1, reminded_24h: null, reminded_1h: null }];
      return Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (url.includes("/rest/v1/cafes")) {
      const cafe = { name: "<script>bad</script>", address: "<b>Main</b>", image_url: null, opening_hours: { mon: "07:00 – 19:00", tue: "07:00 – 19:00" } };
      return Promise.resolve(new Response(JSON.stringify(cafe), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (url.includes("/auth/v1/admin/users")) {
      return Promise.resolve(new Response(JSON.stringify({ users: [{ id: "uid" }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (url.includes("/rest/v1/profiles")) {
      return Promise.resolve(new Response(JSON.stringify([{ wantsReminders: true }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (url.includes("resend.com")) {
      console.log('fetch to resend.com', { body: init?.body });
      html = JSON.parse(init?.body as string).html;
      return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
  };

  const res = await handleReminders();
  assertEquals(res.status, 200);
  console.log('HTML output:', html);
  assert(!html.includes("<script>bad</script>"));
  assert(html.includes("&lt;script&gt;bad&lt;/script&gt;"));

  globalThis.fetch = originalFetch;
  // deno-lint-ignore no-explicit-any
  (globalThis as any).Date = RealDate;
});

addEventListener('unload', () => {
  for (const id of intervals) {
    clearInterval(id);
  }
});

