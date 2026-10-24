import type { Dayjs } from "dayjs";
import { CLINIC_TZ } from "@lib/dayjs";

export type DayRange = [Dayjs | null, Dayjs | null] | null;

// Picked days are clinic days (Asia/Baku): from = start of the first day,
// to = end of the last day, as ISO for the API
export function rangeToIso(range: DayRange): { from?: string; to?: string } {
  const [start, end] = range ?? [null, null];
  return {
    from: start ? start.tz(CLINIC_TZ, true).startOf("day").toISOString() : undefined,
    to: end ? end.tz(CLINIC_TZ, true).endOf("day").toISOString() : undefined,
  };
}
