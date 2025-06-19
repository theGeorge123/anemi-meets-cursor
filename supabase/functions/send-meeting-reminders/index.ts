import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml, AppError, ERROR_CODES, handleError, createErrorResponse, validateEnvVars } from "../utils.ts";

function encodeBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

function sanitizeICSText(text: string) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

async function wantsReminders(
  supabase: ReturnType<typeof createClient>,
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

const slots: Record<string, [string, string]> = {
  morning: ["T070000", "T120000"],
  afternoon: ["T120000", "T160000"],
  evening: ["T160000", "T190000"],
};
const slotReadable: Record<string, string> = {
  morning: "07:00 – 11:59",
  afternoon: "12:00 – 15:59",
  evening: "16:00 – 19:00",
};

// Helper: check if a cafe is open on a given date and slot
function isCafeOpenOnDay(opening_hours: Record<string, string> | null, date: string, slot: 'morning' | 'afternoon' | 'evening'): boolean {
  if (!opening_hours) return false;
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  // Map JS weekday to keys in opening_hours (e.g. 'mon', 'tue', ...)
  const dayMap: Record<string, string> = {
    sun: 'sun', mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat'
  };
  const jsDay = dayOfWeek.slice(0, 3);
  const cafeDay = dayMap[jsDay];
  const hours = opening_hours[cafeDay];
  if (!hours || !hours.includes('–')) return false;
  const [open, close] = hours.split('–').map(s => s.trim());
  // Convert to minutes since midnight
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const openMin = toMinutes(open);
  const closeMin = toMinutes(close);
  // Slot ranges
  const slotRanges: Record<string, [number, number]> = {
    morning: [7 * 60, 12 * 60],
    afternoon: [12 * 60, 16 * 60],
    evening: [16 * 60, 19 * 60],
  };
  const [slotStart, slotEnd] = slotRanges[slot];
  // Check overlap
  return openMin < slotEnd && closeMin > slotStart;
}

export async function handleReminders(): Promise<Response> {
  try {
    // Validate required environment variables
    validateEnvVars([
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "RESEND_API_KEY"
    ]);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const nowDate = new Date();
    const today = nowDate.toISOString().split("T")[0];
    const tomorrow = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: invitations, error } = await supabase
      .from("invitations")
      .select(
        "id, token, email_a, email_b, selected_date, selected_time, cafe_id, reminded_24h, reminded_1h",
      )
      .eq("status", "accepted")
      .gte("selected_date", today)
      .lte("selected_date", tomorrow);

    if (error) {
      throw new AppError(
        "Failed to fetch invitations",
        ERROR_CODES.DATABASE_ERROR,
        500,
        error
      );
    }

    if (!invitations) {
      return new Response(
        JSON.stringify({ message: "No invitations to process" }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const now = new Date();
    const processedInvitations = [];

    for (const inv of invitations) {
      try {
        if (!inv.email_a || !inv.email_b || !inv.selected_date || !inv.selected_time) {
          console.warn("Skipping invitation due to missing data", { id: inv.id });
          continue;
        }

        const slot = String(inv.selected_time).toLowerCase();
        const [dtStart] = slots[slot] || slots["morning"];
        const startTime = new Date(
          `${inv.selected_date}T${dtStart.slice(1, 3)}:${dtStart.slice(3, 5)}:${
            dtStart.slice(5)
          }`,
        );
        const diffMs = startTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const needs24h = diffHours <= 24 && diffHours > 1 && !inv.reminded_24h;
        const needs1h = diffHours <= 1 && diffHours > 0 && !inv.reminded_1h;

        if (!needs24h && !needs1h) continue;

        const { data: cafe, error: cafeErr } = await supabase
          .from("cafes")
          .select("name, address, image_url, opening_hours")
          .eq("id", inv.cafe_id)
          .single();

        if (cafeErr || !cafe) {
          console.error("Failed to fetch cafe details", { 
            invitationId: inv.id,
            error: cafeErr?.message 
          });
          continue;
        }

        // Only send reminder if cafe is open on the selected day and slot
        if (!isCafeOpenOnDay(cafe.opening_hours, inv.selected_date, slot)) {
          console.log(`Cafe ${cafe.name} is not open on ${inv.selected_date} for slot ${slot}`);
          continue;
        }

        const datePart = inv.selected_date.replace(/-/g, "");
        const [_, dtEnd] = slots[slot] || slots["morning"];
        const ics =
          `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Koffie Meetup\nDTSTART:${datePart}${dtStart}\nDTEND:${datePart}${dtEnd}\nDESCRIPTION:Jullie koffie-afspraak!\nLOCATION:${sanitizeICSText(cafe.name)} ${sanitizeICSText(cafe.address)}\nEND:VEVENT\nEND:VCALENDAR`;
        const cafeImageUrl = cafe.image_url ||
          `https://source.unsplash.com/600x300/?coffee,${
            encodeURIComponent(cafe.name)
          }`;
        const safeCafeImageUrl = escapeHtml(cafeImageUrl);
        const readableTime = slotReadable[slot] || slotReadable["morning"];
        const safeCafeName = escapeHtml(cafe.name);
        const safeCafeAddress = escapeHtml(cafe.address);
        const safeReadableTime = escapeHtml(readableTime);
        const safeSelectedDate = escapeHtml(inv.selected_date);
        const subject = needs1h
          ? `☕️ Your meetup starts in about an hour!`
          : `☕️ Reminder: coffee meetup tomorrow!`;
        const html = `
          <h2>☕️ Your coffee meetup is coming up!</h2>
          <img src="${safeCafeImageUrl}" alt="Cafe" width="100%" style="max-width:600px;border-radius:12px;" />
          <p>You'll meet at <b>${safeCafeName}</b> (${safeCafeAddress})</p>
          <p>Time: ${safeReadableTime} on ${safeSelectedDate}</p>`;

        const recipients: string[] = [];
        if (await wantsReminders(supabase, inv.email_a)) {
          recipients.push(inv.email_a);
        }
        if (await wantsReminders(supabase, inv.email_b)) {
          recipients.push(inv.email_b);
        }
        if (recipients.length === 0) continue;

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
            attachments: [
              {
                filename: "meeting.ics",
                content: encodeBase64(ics),
                type: "text/calendar",
              },
            ],
          }),
        });

        if (!emailRes.ok) {
          throw new AppError(
            "Failed to send reminder email",
            ERROR_CODES.EMAIL_ERROR,
            500,
            await emailRes.text()
          );
        }

        const updates: Record<string, string> = {};
        if (needs24h) updates.reminded_24h = new Date().toISOString();
        if (needs1h) updates.reminded_1h = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("invitations")
          .update(updates)
          .eq("id", inv.id);

        if (updateError) {
          throw new AppError(
            "Failed to update reminder status",
            ERROR_CODES.DATABASE_ERROR,
            500,
            updateError
          );
        }

        processedInvitations.push(inv.id);
      } catch (invError) {
        console.error("Error processing invitation", {
          id: inv.id,
          error: invError
        });
        // Continue with next invitation even if one fails
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Reminders processed successfully",
        processed: processedInvitations.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new AppError(
        "Only POST requests allowed",
        ERROR_CODES.INVALID_REQUEST,
        405
      );
    }

    validateEnvVars(["MEETING_REMINDERS_SECRET"]);
    const secret = Deno.env.get("MEETING_REMINDERS_SECRET")!;
    
    const auth = req.headers.get("Authorization");
    if (!auth || auth !== `Bearer ${secret}`) {
      throw new AppError(
        "Invalid or missing authorization",
        ERROR_CODES.UNAUTHORIZED,
        401
      );
    }

    return handleReminders();
  } catch (error) {
    return createErrorResponse(handleError(error));
  }
});

Deno.cron("send-meeting-reminders", "0 9 * * *", () => {
  return handleReminders();
});
