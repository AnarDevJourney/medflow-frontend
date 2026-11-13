import type { ScheduleDay } from "../services/schedulesService";

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

// "09:30" → 570
export const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const lengthOf = (day: Pick<ScheduleDay, "startTime" | "endTime">) =>
  minutesOf(day.endTime) - minutesOf(day.startTime);

// Bookable appointments that day (the backend refuses a half slot)
export const slotsOf = (day: ScheduleDay) =>
  Math.max(0, Math.floor(lengthOf(day) / day.slotMinutes));

// The same rules as the backend (PUT /schedules → 422)
export type DayProblem = "endBeforeStart" | "partialSlot";
export function dayProblem(day: ScheduleDay): DayProblem | null {
  const length = lengthOf(day);
  if (length <= 0) return "endBeforeStart";
  if (length % day.slotMinutes !== 0) return "partialSlot";
  return null;
}

export interface WeekTotals {
  workingDays: number;
  minutes: number;
  slots: number;
}

export const weekTotals = (days: ScheduleDay[]): WeekTotals => ({
  workingDays: days.length,
  minutes: days.reduce((sum, day) => sum + Math.max(0, lengthOf(day)), 0),
  slots: days.reduce((sum, day) => sum + slotsOf(day), 0),
});
