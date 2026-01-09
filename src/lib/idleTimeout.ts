export const MAX_IDLE_TIMEOUT_MS = 2147483647;
export const MAX_IDLE_TIMEOUT_SECONDS = Math.floor(MAX_IDLE_TIMEOUT_MS / 1000);
export const DEFAULT_IDLE_TIMEOUT_SECONDS = 120;

export function parseIdleTimeoutSeconds(
  value: unknown,
  fallback = DEFAULT_IDLE_TIMEOUT_SECONDS
) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_IDLE_TIMEOUT_SECONDS);
}
