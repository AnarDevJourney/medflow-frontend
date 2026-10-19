import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@components/layout/AppLayout";
import { ComingSoonPage } from "@features/coming-soon/pages/ComingSoonPage";
import { DashboardPage } from "@features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { PATHS } from "./paths";

// Pages of later phases — each phase replaces its placeholder
const UPCOMING = [
  PATHS.today,
  PATHS.patients,
  PATHS.appointments,
  PATHS.labQueue,
  PATHS.invoices,
  PATHS.prices,
  PATHS.staff,
  PATHS.departments,
  PATHS.history,
  PATHS.notifications,
];

// TODO(F1): public auth routes (login, accept-invite, forgot / reset
// password) and RequireAuth / RequireRole guards around the AppLayout branch.
export const router = createBrowserRouter([
  {
    path: PATHS.home,
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      ...UPCOMING.map((path) => ({ path, element: <ComingSoonPage /> })),
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
