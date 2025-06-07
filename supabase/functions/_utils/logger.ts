import * as Sentry from "https://esm.sh/@sentry/deno@9.27.0";

const dsn = Deno.env.get("SENTRY_DSN");
if (dsn) {
  Sentry.init({ dsn });
}

export function log(...args: unknown[]) {
  console.log(new Date().toISOString(), ...args);
}

export function logError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  if (dsn) {
    Sentry.captureException(error, { extra: context });
  }
}

export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      log(`Retry attempt ${attempt} failed`, err);
      if (attempt >= retries) {
        logError(err);
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
