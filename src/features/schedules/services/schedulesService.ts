import { api } from "@lib/api/client";

// One working weekday. ISO day: 1 = Monday … 7 = Sunday; times "HH:mm".
export interface ScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

// A doctor's week: working days only, Monday first. A missing day = day off.
export interface Schedule {
  userId: string;
  days: ScheduleDay[];
}

// schedules.read (anyone) or schedules.read_own (only one's own)
export async function getSchedule(userId: string): Promise<Schedule> {
  const { data } = await api.get<Schedule>(`/schedules/${userId}`);
  return data;
}

// schedules.manage — replaces the whole week
export async function replaceSchedule(
  userId: string,
  days: ScheduleDay[],
): Promise<Schedule> {
  const { data } = await api.put<Schedule>(`/schedules/${userId}`, { days });
  return data;
}
