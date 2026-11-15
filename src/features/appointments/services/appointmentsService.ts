import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";
import type { AppointmentStatus } from "@models/enums";

export const AppointmentType = {
  CONSULTATION: "CONSULTATION",
  FOLLOW_UP: "FOLLOW_UP",
  CHECK_UP: "CHECK_UP",
} as const;
export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

// A booked slot from appointment-service. Patient, doctor and department
// are copies taken at booking time (the list never asks other services).
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  patientEmail: string | null;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  startsAt: string; // ISO UTC
  endsAt: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  encounterId: string | null;
  checkedInAt: string | null;
  checkedInByName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  createdByName: string | null;
  updatedByName: string | null; // last reschedule / edit
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsQuery {
  page: number;
  limit: number;
  from?: string; // clinic day YYYY-MM-DD, inclusive
  to?: string;
  doctorId?: string;
  departmentId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  search?: string; // patient name or MRN
  sort?: string; // createdAt | startsAt
  allDoctors?: boolean; // a doctor's list is their own unless this is set
}

// Why a slot cannot be booked
export type SlotBlock = "PAST" | "TAKEN" | "PATIENT_BUSY";

export interface Slot {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: SlotBlock;
}

// Reasons a doctor cannot be booked on a day (staff-service + NO_DEPARTMENT)
export type NotWorkingReason =
  | "NOT_A_DOCTOR"
  | "DEACTIVATED"
  | "VACATION"
  | "SICK_LEAVE"
  | "TRAINING"
  | "DAY_OFF"
  | "NOT_SCHEDULED"
  | "NO_DEPARTMENT";

export type Availability =
  | {
      working: true;
      date: string;
      doctorName: string;
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      start: string; // HH:mm clinic time
      end: string;
      slotMinutes: number;
      slots: Slot[];
    }
  | { working: false; date: string; reason: NotWorkingReason };

export interface AvailabilityQuery {
  doctorId: string;
  date: string; // YYYY-MM-DD
  patientId?: string; // also mark the slots where this patient is busy
}

export interface AppointmentInput {
  patientId: string;
  doctorId: string;
  startsAt: string;
  type: AppointmentType;
  reason?: string | null;
  notes?: string | null;
}

// How far ahead a slot can be booked (appointment-service MAX_DAYS_AHEAD)
export const MAX_DAYS_AHEAD = 90;

export async function listAppointments(
  query: AppointmentsQuery,
): Promise<Paginated<Appointment>> {
  const { data } = await api.get<Paginated<Appointment>>("/appointments", {
    params: query,
  });
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function getAvailability(query: AvailabilityQuery): Promise<Availability> {
  const { data } = await api.get<Availability>("/appointments/availability", {
    params: query,
  });
  return data;
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", input);
  return data;
}

// Today's appointments in time order (a doctor gets their own)
export async function listTodayAppointments(query: {
  departmentId?: string;
  doctorId?: string;
}): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments/today", { params: query });
  return data;
}

// Visit type, reason, notes (SCHEDULED or CHECKED_IN)
export interface AppointmentEdit {
  type?: AppointmentType;
  reason?: string | null;
  notes?: string | null;
}

export async function updateAppointment(
  id: string,
  input: AppointmentEdit,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}`, input);
  return data;
}

// Another time and / or doctor (SCHEDULED); the same rules as booking
export async function rescheduleAppointment(
  id: string,
  input: { startsAt: string; doctorId?: string },
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/reschedule`, input);
  return data;
}

export async function cancelAppointment(
  id: string,
  reason: string,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/cancel`, { reason });
  return data;
}

// The patient arrived — only on the appointment's day
export async function checkInAppointment(id: string): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/check-in`);
  return data;
}

// Calendar: the doctors' days of a range + its appointments (one request)
export type RangeDay =
  | { date: string; working: true; start: string; end: string; slotMinutes: number }
  | { date: string; working: false; reason: NotWorkingReason };

export interface DoctorDays {
  userId: string;
  doctorName: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  days: RangeDay[];
}

export interface CalendarData {
  from: string;
  to: string;
  doctors: DoctorDays[];
  appointments: Appointment[];
}

export interface CalendarQuery {
  from: string; // YYYY-MM-DD, inclusive, ≤ 14 days
  to: string;
  departmentId?: string;
  doctorId?: string;
  includeCancelled?: boolean;
}

export async function getCalendar(query: CalendarQuery): Promise<CalendarData> {
  const { data } = await api.get<CalendarData>("/appointments/calendar", {
    params: query,
  });
  return data;
}
