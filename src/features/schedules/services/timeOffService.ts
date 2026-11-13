import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";

export type TimeOffType = "DAY_OFF" | "VACATION" | "SICK_LEAVE" | "TRAINING";
export const TIME_OFF_TYPES: TimeOffType[] = [
  "VACATION",
  "SICK_LEAVE",
  "DAY_OFF",
  "TRAINING",
];

// One leave period of a doctor. Calendar days, end inclusive.
export interface TimeOff {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  type: TimeOffType;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  days: number;
  reason: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface TimeOffQuery {
  userId?: string; // without schedules.read the backend shows only one's own
  scope?: "upcoming" | "past"; // not ended yet / already ended (clinic today)
  from?: string; // periods touching [from, to], YYYY-MM-DD
  to?: string;
  sort?: string; // createdAt (default, desc) | startDate
  page?: number;
  limit?: number;
}

export interface CreateTimeOffInput {
  userId: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export async function listTimeOff(query: TimeOffQuery): Promise<Paginated<TimeOff>> {
  const { data } = await api.get<Paginated<TimeOff>>("/time-off", { params: query });
  return data;
}

// schedules.manage. 409 CONFLICT { field: "startDate" } = overlaps another period
export async function createTimeOff(input: CreateTimeOffInput): Promise<TimeOff> {
  const { data } = await api.post<TimeOff>("/time-off", input);
  return data;
}

// schedules.manage. 409 INVALID_STATUS = the period has already ended
export async function deleteTimeOff(id: string): Promise<void> {
  await api.delete(`/time-off/${id}`);
}
