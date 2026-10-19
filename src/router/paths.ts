// Every route of the app in one place — links and redirects import these
// instead of repeating string literals. Each module adds its paths here.
export const PATHS = {
  home: "/",
  today: "/today",
  patients: "/patients",
  appointments: "/appointments",
  labQueue: "/lab-queue",
  invoices: "/invoices",
  prices: "/settings/prices",
  staff: "/staff",
  departments: "/settings/departments",
  history: "/history",
  notifications: "/notifications",
} as const;
