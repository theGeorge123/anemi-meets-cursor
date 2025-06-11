import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml } from "../utils.ts";

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

export async function handleFriendInvite(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed." }),
      {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
        },
      },
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
          },
        },
      );
    }

    const { inviter_id, invitee_email, lang = "nl" } = await req.json();
    if (!inviter_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
          },
        },
      );
    }

    // Generate a unique token
    let token = getUUID().replace(/-/g, "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Ensure the token is unique
    let { data: existingInvite } = await supabase
      .from("friend_invites")
      .select("id")
      .eq("token", token)
      .maybeSingle();
    while (existingInvite) {
      token = getUUID().replace(/-/g, "");
      ({ data: existingInvite } = await supabase
        .from("friend_invites")
        .select("id")
        .eq("token", token)
        .maybeSingle());
    }

    // Insert the friend_invites row
    const insertData: Record<string, unknown> = { inviter_id, token };
    if (invitee_email) insertData.invitee_email = invitee_email;
    const { error: insertError } = await supabase.from("friend_invites").insert(
      insertData,
    );
    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Could not create invite" }),
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
          },
        },
      );
    }

    // Look up inviter profile
    const { data: inviter, error: inviterError } = await supabase
      .from("profiles")
      .select("fullName, email")
      .eq("id", inviter_id)
      .maybeSingle();
    if (inviterError || !inviter) {
      return new Response(
        JSON.stringify({ error: "Inviter not found" }),
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
          },
        },
      );
    }

    const isEnglish = lang === "en";
    // @ts-expect-error Deno globals are available in Edge Functions
    const inviteLink = `${Deno.env.get("PUBLIC_SITE_URL") || "https://anemimeets.com"}/invite-friend/${token}`;
    const siteUrl = inviteLink.split('/invite-friend/')[0];
    const safeName = escapeHtml(inviter.fullName || (isEnglish ? "A friend" : "Een vriend"));
    const subject = isEnglish
      ? `${safeName} invited you for coffee on Anemi Meets! ☕️`
      : `${safeName} heeft je uitgenodigd op Anemi Meets! ☕️`;
    const safeInviteLink = escapeHtml(inviteLink);
    const safeSiteUrl = escapeHtml(siteUrl);
    const html = isEnglish
      ? `
        <h2>☕️ ${safeName} wants to connect with you on Anemi Meets!</h2>
        <p>Hi there!<br><br>
        <b>${safeName}</b> thinks you're awesome and wants to be friends on <b>Anemi Meets</b>.<br>
        <br>
        <a href="${safeInviteLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Accept Invite & Become Friends</a>
        <br><br>
        <b>Why did you get this invite?</b><br>
        Someone you know wants to connect, plan meetups, and share good times!<br><br>
        <b>What is Anemi Meets?</b><br>
        Anemi Meets is the easiest way to plan real-life coffee meetups with friends. No endless group chats, just pick a time and meet up! 100% free, privacy-friendly, and made for real connections.<br><br>
        Curious? <a href="${safeSiteUrl}">${safeSiteUrl}</a>
        <br><br>
        See you soon! ☕️✨
        </p>
      `
      : `
        <h2>☕️ ${safeName} wil met je verbinden op Anemi Meets!</h2>
        <p>Hoi!<br><br>
        <b>${safeName}</b> vindt jou gezellig en wil vrienden worden op <b>Anemi Meets</b>.<br>
        <br>
        <a href="${safeInviteLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Accepteer Uitnodiging & Word Vrienden</a>
        <br><br>
        <b>Waarom krijg je deze uitnodiging?</b><br>
        Iemand die je kent wil met je verbinden, samen afspreken en leuke momenten delen!<br><br>
        <b>Wat is Anemi Meets?</b><br>
        Anemi Meets is de makkelijkste manier om echte koffiedates te plannen met vrienden. Geen eindeloze groepsapps, gewoon een tijd kiezen en afspreken! 100% gratis, privacyvriendelijk en gemaakt voor échte connecties.<br><br>
        Nieuwsgierig? <a href="${safeSiteUrl}">${safeSiteUrl}</a>
        <br><br>
        Tot snel! ☕️✨
        </p>
      `;

    if (invitee_email) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@anemimeets.com",
          to: [invitee_email],
          subject,
          html,
        }),
      });

      if (!emailRes.ok) {
        throw new Error("Email not sent: " + (await emailRes.text()));
      }
    }

    return new Response(
      JSON.stringify({ success: true, token }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
      },
    });
  }
}

Deno.serve(handleFriendInvite); 