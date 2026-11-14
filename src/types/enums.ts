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

// auth users.status
export const UserStatus = {
  INVITED: "INVITED", // created by an admin, password not set yet
  ACTIVE: "ACTIVE",
  DEACTIVATED: "DEACTIVATED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// patient-service patients.gender / blood_type
export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const BloodType = {
  A_POS: "A_POS",
  A_NEG: "A_NEG",
  B_POS: "B_POS",
  B_NEG: "B_NEG",
  AB_POS: "AB_POS",
  AB_NEG: "AB_NEG",
  O_POS: "O_POS",
  O_NEG: "O_NEG",
} as const;
export type BloodType = (typeof BloodType)[keyof typeof BloodType];

// patient-service clinical summary
export const AllergyCategory = {
  DRUG: "DRUG",
  FOOD: "FOOD",
  ENVIRONMENTAL: "ENVIRONMENTAL",
  OTHER: "OTHER",
} as const;
export type AllergyCategory = (typeof AllergyCategory)[keyof typeof AllergyCategory];

export const AllergySeverity = {
  SEVERE: "SEVERE",
  MODERATE: "MODERATE",
  MILD: "MILD",
} as const;
export type AllergySeverity = (typeof AllergySeverity)[keyof typeof AllergySeverity];

export const ConditionStatus = {
  ACTIVE: "ACTIVE",
  RESOLVED: "RESOLVED",
} as const;
export type ConditionStatus = (typeof ConditionStatus)[keyof typeof ConditionStatus];
