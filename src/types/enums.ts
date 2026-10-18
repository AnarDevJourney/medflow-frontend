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
