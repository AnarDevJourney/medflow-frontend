import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";

export interface HistoryEntry {
  id: string;
  eventId: string;
  eventType: string; // 'user.invited', 'appointment.cancelled', …
  source: string; // producing service
  actor: { id: string; name: string; role: string } | null; // null = system
  entityType: string;
  entityId: string;
  patientId: string | null;
  summary: string; // English; fallback when summaryKey is null
  // Translatable form: historyEvents.<summaryKey> filled with the params
  summaryKey: string | null;
  summaryParams: Record<string, unknown>;
  metadata: Record<string, unknown>;
  correlationId: string | null;
  occurredAt: string;
}

export type EmailStatus = "QUEUED" | "SENT" | "FAILED";

export interface EmailLog {
  id: string;
  eventId: string;
  recipientEmail: string;
  template: string;
  subject: string;
  status: EmailStatus;
  attempts: number;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface Range {
  page: number;
  limit: number;
  sort?: string;
  from?: string; // ISO
  to?: string;
}

export interface HistoryQuery extends Range {
  eventType?: string;
  entityType?: string;
  actorId?: string;
}

export interface EmailLogsQuery extends Range {
  status?: EmailStatus;
  template?: string;
  recipient?: string;
}

// Global audit feed (ADMIN)
export async function listHistory(query: HistoryQuery): Promise<Paginated<HistoryEntry>> {
  const { data } = await api.get<Paginated<HistoryEntry>>("/history", { params: query });
  return data;
}

export type PersonHistoryQuery = Omit<Range, "sort">;

// Everything that happened to one person: account, work profile, schedule,
// time off (history.user_read)
export async function listPersonHistory(
  userId: string,
  query: PersonHistoryQuery,
): Promise<Paginated<HistoryEntry>> {
  const { data } = await api.get<Paginated<HistoryEntry>>(
    `/history/users/${userId}/about`,
    { params: query },
  );
  return data;
}

// What one person did (history.user_read)
export async function listUserActivity(
  userId: string,
  query: PersonHistoryQuery,
): Promise<Paginated<HistoryEntry>> {
  const { data } = await api.get<Paginated<HistoryEntry>>(`/history/users/${userId}`, {
    params: query,
  });
  return data;
}

// Everything recorded about one patient (history.patient_read)
export async function listPatientHistory(
  patientId: string,
  query: PersonHistoryQuery,
): Promise<Paginated<HistoryEntry>> {
  const { data } = await api.get<Paginated<HistoryEntry>>(
    `/history/patients/${patientId}`,
    { params: query },
  );
  return data;
}

// Every email the system sent or tried to send (ADMIN)
export async function listEmailLogs(query: EmailLogsQuery): Promise<Paginated<EmailLog>> {
  const { data } = await api.get<Paginated<EmailLog>>("/history/emails", {
    params: query,
  });
  return data;
}

// Known values for the filters (each phase adds its events / templates)
export const EVENT_TYPES = [
  "user.invited",
  "user.activated",
  "user.updated",
  "user.deactivated",
  "user.reactivated",
  "user.password_changed",
  "user.session_revoked",
  "role_permissions.updated",
  "department.created",
  "department.updated",
  "staff.updated",
  "schedule.updated",
  "time_off.created",
  "time_off.deleted",
  "patient.registered",
  "patient.updated",
  "patient.deactivated",
  "patient.reactivated",
  "patient.allergy_added",
  "patient.allergy_updated",
  "patient.allergy_removed",
  "patient.condition_added",
  "patient.condition_updated",
  "patient.condition_removed",
];
export const ENTITY_TYPES = ["USER", "ROLE", "DEPARTMENT", "STAFF_MEMBER", "PATIENT"];
export const EMAIL_TEMPLATES = [
  "staff-invite",
  "password-reset",
  "password-changed",
  "session-revoked",
];
