// Mirrors the backend enums exactly (libs/common, DATABASE.md)

// Single global role per user — in the JWT, drives menus and route guards
export const Role = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES = Object.values(Role);

// Appointment lifecycle (DATABASE.md appointments.status)
export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  CHECKED_IN: "CHECKED_IN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
