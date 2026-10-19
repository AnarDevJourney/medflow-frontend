import type { AppointmentStatus } from "@models/enums";

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
