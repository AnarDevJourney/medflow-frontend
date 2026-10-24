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
];
export const ENTITY_TYPES = ["USER"];
export const EMAIL_TEMPLATES = [
  "staff-invite",
  "password-reset",
  "password-changed",
  "session-revoked",
];
