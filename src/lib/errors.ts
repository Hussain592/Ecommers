/**
 * The message to show for a failed action.
 *
 * Supabase returns plain error objects (not `Error` instances), so checking
 * `instanceof Error` hides helpful database messages like
 * "Not enough stock for: ...". This reads `message` from either kind.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
