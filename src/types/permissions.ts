// Mirrors the permission catalog of the backend (libs/common permissions.ts).
// Which role has which one is decided by the admin on the permissions page;
// the client only asks "may I?" with useCan().
export const PERMISSIONS = [
  "users.read",
  "users.invite",
  "users.update",
  "users.deactivate",
  "permissions.read",
  "permissions.manage",
  "departments.read",
  "departments.manage",
  "staff.read",
  "staff.update",
  "schedules.read",
  "schedules.read_own",
  "schedules.manage",
  "patients.read",
  "patients.create",
  "patients.update",
  "patients.deactivate",
  "patients.clinical_read",
  "patients.clinical_manage",
  "patients.stats",
  "appointments.read",
  "appointments.availability",
  "appointments.book",
  "appointments.check_in",
  "appointments.stats",
  "appointments.stats_own",
  "encounters.read",
  "encounters.manage",
  "vitals.record",
  "diagnoses.manage",
  "prescriptions.manage",
  "lab_orders.manage",
  "records.read",
  "records.stats",
  "lab.process",
  "lab.stats",
  "invoices.read",
  "invoices.manage",
  "payments.create",
  "payments.read",
  "prices.read",
  "prices.manage",
  "billing.stats",
  "files.upload",
  "files.patient_documents",
  "files.lab_results",
  "files.delete_any",
  "history.read",
  "history.entity_read",
  "history.patient_read",
  "history.user_read",
  "emails.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type PermissionGroup =
  | "users"
  | "permissions"
  | "staff"
  | "patients"
  | "appointments"
  | "encounters"
  | "records"
  | "lab"
  | "billing"
  | "files"
  | "history";
