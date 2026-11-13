import dayjs, { CLINIC_TZ, formatDay } from "@lib/dayjs";
import type { TimeOff } from "../services/timeOffService";

// "Today" in the clinic, YYYY-MM-DD (the backend uses the same day)
export const clinicToday = () => dayjs().tz(CLINIC_TZ).format("YYYY-MM-DD");

// "15 Jul 2026" or "15 Jul 2026 – 29 Jul 2026"
export const formatPeriod = (start: string, end: string) =>
  start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;

export const isCurrent = (
  t: Pick<TimeOff, "startDate" | "endDate">,
  today = clinicToday(),
) => t.startDate <= today && today <= t.endDate;

// Calendar days, both ends included
export const daysBetween = (start: string, end: string) =>
  dayjs(end).diff(dayjs(start), "day") + 1;

export const MAX_TIME_OFF_DAYS = 365;
