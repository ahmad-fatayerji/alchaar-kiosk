// Timezone utilities for Lebanon (Asia/Beirut)
// Provides helpers usable on both server and client.

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const LEBANON_TZ = "Asia/Beirut" as const;

// Returns YYYY-MM-DD for current date in Lebanon time
export function todayInLebanonYMD(): string {
    return formatInTimeZone(new Date(), LEBANON_TZ, "yyyy-MM-dd");
}

// Given a YYYY-MM-DD understood in Lebanon local time,
// return the UTC start and end Date objects covering that local day.
export function lebanonDayToUtcRange(ymd: string): { start: Date; end: Date } {
    // Use explicit wall clock times in Lebanon and convert them to UTC
    const start = fromZonedTime(`${ymd}T00:00:00.000`, LEBANON_TZ);
    const end = fromZonedTime(`${ymd}T23:59:59.999`, LEBANON_TZ);
    return { start, end };
}

// Format a date/time in Lebanon timezone with Intl. Works in Node and browser.
export function formatLebanon(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions
): string {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat(undefined, { timeZone: LEBANON_TZ, ...options }).format(d);
}
