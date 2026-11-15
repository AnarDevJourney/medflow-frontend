import { toClinicTime } from "@lib/dayjs";

// "09:00–09:30" in clinic time
export const timeRange = (startsAt: string, endsAt: string) =>
  `${toClinicTime(startsAt).format("HH:mm")}–${toClinicTime(endsAt).format("HH:mm")}`;

// "Mon, 17 Nov 2026"
export const dayLabel = (startsAt: string) =>
  toClinicTime(startsAt).format("ddd, DD MMM YYYY");

// The appointment is on the clinic's today (check-in is allowed then)
export const isClinicToday = (startsAt: string) =>
  toClinicTime(startsAt).isSame(toClinicTime(new Date()), "day");
