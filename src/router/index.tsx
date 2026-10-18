import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@components/layout/AppLayout";
import { DashboardPage } from "@features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { PATHS } from "./paths";

// TODO(F1): public auth routes (login, accept-invite, forgot / reset
// password) and a RequireAuth guard around the AppLayout branch.
export const router = createBrowserRouter([
  {
    path: PATHS.home,
    element: <AppLayout />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
  { path: "*", element: <NotFoundPage /> },
]);
