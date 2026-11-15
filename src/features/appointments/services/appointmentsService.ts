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
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
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
