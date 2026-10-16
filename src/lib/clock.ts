/**
 * Sign-in tokens carry the server time they were issued (iat) and expire one hour
 * later (exp). If the device clock is wrong by more than that, the browser treats
 * every token as expired, refreshes it again and again until Supabase rate-limits
 * the requests, and the user is signed out. We can't fix the clock, but we can
 * detect it and tell the user how to fix it.
 */

const TOLERANCE_SECONDS = 5 * 60;

function tokenTimes(accessToken: string): { iat: number; exp: number } | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      iat?: unknown;
      exp?: unknown;
    };
    const iat = Number(payload.iat);
    const exp = Number(payload.exp);
    return Number.isFinite(iat) && Number.isFinite(exp) ? { iat, exp } : null;
  } catch {
    return null;
  }
}

/**
 * Seconds the device clock is off (positive = ahead), or null when it looks fine.
 * A token the server just issued must be valid "now"; if the device thinks it is
 * outside the token's lifetime, the device clock is wrong.
 */
export function deviceClockSkew(accessToken: string): number | null {
  const times = tokenTimes(accessToken);
  if (!times) return null;
  const now = Date.now() / 1000;
  if (now > times.exp + TOLERANCE_SECONDS || now < times.iat - TOLERANCE_SECONDS) {
    return Math.round(now - times.iat);
  }
  return null;
}

export function describeClockSkew(seconds: number) {
  const hours = Math.round(Math.abs(seconds) / 3600);
  const amount =
    hours >= 1
      ? `about ${hours} ${hours === 1 ? "hour" : "hours"}`
      : `${Math.round(Math.abs(seconds) / 60)} minutes`;
  return `Your device's clock is ${amount} ${seconds > 0 ? "ahead" : "behind"}`;
}

export const CLOCK_FIX_STEPS =
  'Windows: Settings → Time & language → Date & time → turn on "Set time automatically" and choose the time zone "(UTC+05:00) Islamabad, Karachi". Phone: Settings → Date & time → Automatic. Then reload this page and sign in again.';
