// Every route of the app in one place — links and redirects import these
// instead of repeating string literals. Each module adds its paths here.
export const PATHS = {
  // public (auth) pages — the email links point to accept-invite / reset-password
  login: "/login",
  acceptInvite: "/accept-invite",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  home: "/",
  profile: "/profile",
  today: "/today",
  patients: "/patients",
  appointments: "/appointments",
  labQueue: "/lab-queue",
  invoices: "/invoices",
  prices: "/settings/prices",
  staff: "/staff",
  departments: "/settings/departments",
  permissions: "/settings/permissions",
  history: "/history",
  notifications: "/notifications",
  devTable: "/dev/table", // dev builds only
} as const;
