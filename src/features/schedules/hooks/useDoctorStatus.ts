import dayjs from "@lib/dayjs";
import type { ScheduleDay } from "../services/schedulesService";
import type { TimeOff } from "../services/timeOffService";
import { clinicToday, isCurrent } from "../utils/timeOff";
import { useSchedule } from "./useSchedule";
import { useTimeOff } from "./useTimeOff";

// ISO weekday (1 = Monday … 7 = Sunday) of a YYYY-MM-DD day
export const isoWeekday = (ymd: string) => {
  const day = dayjs(ymd).day();
  return day === 0 ? 7 : day;
};

export interface DoctorStatus {
  loading: boolean;
  days: ScheduleDay[];
  today: ScheduleDay | undefined; // today's hours, if today is a working day
  away: TimeOff | undefined; // the period going on now
  next: TimeOff | undefined; // the next period that has not started
}

// Where a doctor stands today: weekly hours plus current / next time off.
// The caller checks the viewer may see the schedule.
export function useDoctorStatus(userId: string, enabled: boolean): DoctorStatus {
  const schedule = useSchedule(userId, enabled);
  const upcoming = useTimeOff(
    { userId, scope: "upcoming", sort: "startDate:asc", limit: 2 },
    enabled,
  );
  const days = schedule.data?.days ?? [];
  const todayYmd = clinicToday();
  const items = upcoming.data?.items ?? [];

  return {
    loading: schedule.isPending || upcoming.isPending,
    days,
    today: days.find((day) => day.dayOfWeek === isoWeekday(todayYmd)),
    away: items.find((item) => isCurrent(item, todayYmd)),
    next: items.find((item) => item.startDate > todayYmd),
  };
}
