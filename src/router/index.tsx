import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@components/layout/AppLayout";
import { NAV_ITEMS, permissionFor } from "@components/layout/navigation";
import { AcceptInvitePage } from "@features/auth/pages/AcceptInvitePage";
import { ForgotPasswordPage } from "@features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "@features/auth/pages/LoginPage";
import { ResetPasswordPage } from "@features/auth/pages/ResetPasswordPage";
import { ComingSoonPage } from "@features/coming-soon/pages/ComingSoonPage";
import { DashboardPage } from "@features/dashboard/pages/DashboardPage";
import { TableDemoPage } from "@features/dev/pages/TableDemoPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { HistoryPage } from "@features/history/pages/HistoryPage";
import { NotificationsPage } from "@features/notifications/pages/NotificationsPage";
import { PermissionsPage } from "@features/permissions/pages/PermissionsPage";
import { ProfilePage } from "@features/profile/pages/ProfilePage";
import { StaffPage } from "@features/staff/pages/StaffPage";
import { PATHS } from "./paths";
import { PublicOnly } from "./PublicOnly";
import { RequireAuth } from "./RequireAuth";
import { RequirePermission } from "./RequirePermission";

// Pages that exist; every other nav entry shows its "coming soon" page
const BUILT = new Set(["dashboard", "notifications", "staff", "history", "permissions"]);

// Signed-in pages need the same permission as their nav entry (and the backend)
const gated = (key: string, element: React.ReactNode) => (
  <RequirePermission permission={permissionFor(key)}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
  // Public — email links point to accept-invite and reset-password
  {
    path: PATHS.login,
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: PATHS.forgotPassword,
    element: (
      <PublicOnly>
        <ForgotPasswordPage />
      </PublicOnly>
    ),
  },
  { path: PATHS.acceptInvite, element: <AcceptInvitePage /> },
  { path: PATHS.resetPassword, element: <ResetPasswordPage /> },

  {
    path: PATHS.home,
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: PATHS.profile, element: <ProfilePage /> },
      { path: PATHS.notifications, element: <NotificationsPage /> },
      { path: PATHS.staff, element: gated("staff", <StaffPage />) },
      { path: PATHS.history, element: gated("history", <HistoryPage />) },
      { path: PATHS.permissions, element: gated("permissions", <PermissionsPage />) },
      ...NAV_ITEMS.filter((item) => !BUILT.has(item.key)).map((item) => ({
        path: item.path,
        element: gated(item.key, <ComingSoonPage />),
      })),
      // Component playgrounds — not part of production builds
      ...(import.meta.env.DEV
        ? [{ path: PATHS.devTable, element: <TableDemoPage /> }]
        : []),
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
