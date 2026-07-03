// Time normalization for Loki, which wants epoch nanoseconds as a string.
//
// Accepts:
//   - a numeric (digits-only) unix timestamp — the unit is inferred from the
//     number of digits: seconds / milliseconds / microseconds / nanoseconds;
//   - an ISO-8601 date string — parsed and converted to nanoseconds.
// BigInt is used throughout so nanosecond values never lose precision.

const DIGITS_ONLY = /^\d+$/;

// Current time in epoch nanoseconds (ms -> ns, precision-safe).
export function nowNs(): string {
  return `${Date.now()}000000`;
}

const NS_PER_SECOND = BigInt(1_000_000_000);
const NS_PER_MS = BigInt(1_000_000);
const NS_PER_US = BigInt(1_000);

function unixToNanos(digits: string): string {
  const value = BigInt(digits);
  const len = digits.length;
  if (len <= 10) return (value * NS_PER_SECOND).toString(); // seconds
  if (len <= 13) return (value * NS_PER_MS).toString(); // milliseconds
  if (len <= 16) return (value * NS_PER_US).toString(); // microseconds
  return value.toString(); // nanoseconds
}

function isoToNanos(iso: string): string | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return (BigInt(ms) * NS_PER_MS).toString();
}

// Returns epoch nanoseconds for a valid time, or null if unparseable.
export function toNanos(time: string): string | null {
  if (DIGITS_ONLY.test(time)) return unixToNanos(time);
  return isoToNanos(time);
}

export function isValidTime(time: string): boolean {
  return toNanos(time) !== null;
}

// ISO-8601 string for a given epoch-nanoseconds value (ms precision).
export function nsToIso(ns: string): string {
  const ms = BigInt(ns) / NS_PER_MS;
  return new Date(Number(ms)).toISOString();
}
