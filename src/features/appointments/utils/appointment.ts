import { toClinicTime } from "@lib/dayjs";

// "09:00–09:30" in clinic time
export const timeRange = (startsAt: string, endsAt: string) =>
  `${toClinicTime(startsAt).format("HH:mm")}–${toClinicTime(endsAt).format("HH:mm")}`;

// "Mon, 17 Nov 2026"
export const dayLabel = (startsAt: string) =>
  toClinicTime(startsAt).format("ddd, DD MMM YYYY");
