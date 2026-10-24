import type { AppointmentStatus, UserStatus } from "@models/enums";

// Appointment status colors of DOC 9 as CSS variables (global.css) —
// badges, the "accent" table view and the calendar use the same ones
export const STATUS_COLOR: Record<AppointmentStatus, string> = {
  SCHEDULED: "var(--color-status-scheduled)",
  CHECKED_IN: "var(--color-status-checked-in)",
  IN_PROGRESS: "var(--color-status-in-progress)",
  COMPLETED: "var(--color-status-completed)",
  CANCELLED: "var(--color-status-cancelled)",
  NO_SHOW: "var(--color-status-no-show)",
};

// Account status colors — same as UserStatusTag
export const USER_STATUS_COLOR: Record<UserStatus, string> = {
  ACTIVE: "var(--color-success)",
  INVITED: "var(--color-warning)",
  DEACTIVATED: "var(--color-muted)",
};

// Email delivery colors — same as EmailStatusTag
export const EMAIL_STATUS_COLOR: Record<"QUEUED" | "SENT" | "FAILED", string> = {
  QUEUED: "var(--color-muted)",
  SENT: "var(--color-success)",
  FAILED: "var(--color-error)",
};
