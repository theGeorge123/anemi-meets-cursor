import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from '../../../src/types/supabase.ts';
import { escapeHtml } from "../utils.ts";

function encodeBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

function sanitizeICSText(text: string) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

async function wantsReminders(
  supabase: SupabaseClient<Database>,
  email: string,
): Promise<boolean> {
  const { data: user, error: userError } = await supabase.auth.admin
    .getUserByEmail(email);

  if (userError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("wantsReminders")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return false;
  }

  return !!profile?.wantsReminders;
}

function getUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Secure fallback using crypto.getRandomValues
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Per RFC4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return [...bytes].map((b, i) =>
      ([4, 6, 8, 10].includes(i) ? "-" : "") + b.toString(16).padStart(2, "0")
    ).join("");
  }
  throw new Error("No secure random generator available for UUID");
}

export async function handleConfirmation(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed." }),
      {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
      },
    );
  }

  try {
    // @ts-expect-error Deno globals are available in Edge Functions
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-expect-error Deno globals are available in Edge Functions
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // @ts-expect-error Deno globals are available in Edge Functions
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error("env_error", {
        message: "Missing environment variables",
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY: !!RESEND_API_KEY,
      });
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    const { token, email_b, selected_date, selected_time, lang = "nl" } =
      await req.json();
    const isEnglish = lang === "en";
    if (!token || !email_b || !selected_date || !selected_time) {
      console.error("validation_error", {
        token,
        email_b,
        selected_date,
        selected_time,
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check invitation first to validate email and status
    const { data: existing, error: fetchError } = await supabase
      .from("invitations")
      .select("email_b, status, email_a, cafe_id")
      .eq("token", token)
      .single();

    if (fetchError || !existing) {
      console.error("fetch_error", { message: fetchError?.message });
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
      });
    }

    if (existing.status === "accepted") {
      console.error("status_error", { status: existing.status });
      return new Response(
        JSON.stringify({ error: "Invitation already used" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    if (existing.email_b && existing.email_b !== email_b) {
      console.error("email_mismatch", {
        expected: existing.email_b,
        received: email_b,
      });
      return new Response(
        JSON.stringify({ error: "Email does not match invitation" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    const { data: invitation, error } = await supabase
      .from("invitations")
      .update({ email_b, selected_date, selected_time, status: "accepted" })
      .eq("token", token)
      .select()
      .single();

    if (error || !invitation) {
      console.error("update_error", { message: error?.message });
      return new Response(
        JSON.stringify({ error: "Could not update invitation" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    const { email_a, cafe_id } = invitation;
    if (!email_a || !cafe_id) {
      console.error("data_error", { email_a, cafe_id });
      return new Response(
        JSON.stringify({ error: "Invitation data incomplete" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        },
      );
    }

    const { data: cafe, error: cafeError } = await supabase
      .from("cafes")
      .select("name, address, image_url")
      .eq("id", cafe_id)
      .single();

    if (cafeError || !cafe) {
      console.error("cafe_error", { message: cafeError?.message });
      return new Response(JSON.stringify({ error: "Cafe not found" }), {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
      });
    }

    const slots = {
      morning: ["T090000", "T120000"],
      afternoon: ["T120000", "T170000"],
      evening: ["T170000", "T210000"],
    };
    const readable = {
      morning: "09:00 – 12:00",
      afternoon: "12:00 – 17:00",
      evening: "17:00 – 21:00",
    };

    const slot = selected_time.toLowerCase();
    const [dtStart, dtEnd] = slots[slot] || slots["morning"];
    const readableTime = readable[slot] || readable["morning"];
    const datePart = selected_date.replace(/-/g, "");
    const uid = getUUID();
    const dtStamp =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics =
      `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${dtStamp}\nSUMMARY:Koffie Meetup\nDTSTART:${datePart}${dtStart}\nDTEND:${datePart}${dtEnd}\nDESCRIPTION:Jullie koffie-afspraak!\nLOCATION:${sanitizeICSText(cafe.name)} ${sanitizeICSText(cafe.address)}\nEND:VEVENT\nEND:VCALENDAR`;
    const icsBase64 = encodeBase64(ics);

    const cafeImageUrl = cafe.image_url ||
      `https://source.unsplash.com/600x300/?coffee,${
        encodeURIComponent(cafe.name)
      }`;
    const safeCafeImageUrl = escapeHtml(cafeImageUrl);
    const gcalUrl =
      `https://www.google.com/calendar/render?action=TEMPLATE&text=${
        encodeURIComponent("Koffie Meetup via Anemi")
      }&dates=${datePart}${dtStart}/${datePart}${dtEnd}&location=${
        encodeURIComponent(`${cafe.name} ${cafe.address}`)
      }`;
    const safeGcalUrl = escapeHtml(gcalUrl);

    const nameA = email_a.split("@")[0];
    const safeNameA = escapeHtml(nameA);
    const safeCafeName = escapeHtml(cafe.name);
    const safeCafeAddress = escapeHtml(cafe.address);
    const safeReadableTime = escapeHtml(readableTime);
    const safeSelectedDate = escapeHtml(selected_date);
    const subject = isEnglish
      ? `☕️ ${safeNameA} just booked coffee with you!`
      : `☕️ ${safeNameA} heeft een koffie-date gepland!`;

    const html = `
      <h2>${
      isEnglish
        ? "☕️ Yes! Your coffee meetup is set!"
        : "☕️ Yes! Jullie koffie-date staat!"
    }</h2>
      <img src="${safeCafeImageUrl}" alt="Cafe" width="100%" style="max-width:600px;border-radius:12px;" />
      <p>${isEnglish ? "Hey legends!" : "Hey toppers!"}<br>
      ${
      isEnglish ? "You're meeting at" : "Jullie hebben afgesproken bij"
    } <b>${safeCafeName}</b>.<br>
      <b>${
      isEnglish ? "Address" : "Adres"
    }:</b> ${safeCafeAddress}<br>
      <b>${
      isEnglish ? "Time" : "Tijd"
    }:</b> ${safeReadableTime} on ${safeSelectedDate}</p>
      <p><a href="${safeGcalUrl}" target="_blank">➕ ${
      isEnglish ? "Add to Google Calendar" : "Voeg toe aan Google Calendar"
    }</a></p>`;

    // Always send to both parties, regardless of wantsReminders
    const recipients: string[] = [];
    if (email_a) recipients.push(email_a);
    if (email_b && email_b !== email_a) recipients.push(email_b);
    console.log('Sending confirmation email to:', recipients);

    if (recipients.length > 0) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@anemimeets.com",
          to: recipients,
          subject,
          html,
          attachments: [{
            filename: "meeting.ics",
            content: icsBase64,
            type: "text/calendar",
          }],
        }),
      });

      if (!emailRes.ok) {
        throw new Error("Email not sent: " + (await emailRes.text()));
      }
    }

    // TODO: Auto-friendship creation if a new user signs up via invite
    // This could be handled here or in a signup trigger/edge function

    // @ts-expect-error Deno globals are available in Edge Functions
    const inviteLink = `${Deno.env.get("PUBLIC_SITE_URL") || "https://anemimeets.com"}/invite-friend/${token}`;

    return new Response(
      JSON.stringify({
        success: true,
        cafe_name: cafe.name,
        cafe_address: cafe.address,
        invitation_token: token,
        selected_date,
        selected_time,
        ics_base64: icsBase64,
        invite_link: inviteLink,
      }),
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, apikey, authorization" },
      },
    );
  } catch (e) {
    console.error("unhandled_error", { message: (e as Error).message });
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
    });
  }
}

Deno.serve(handleConfirmation);
