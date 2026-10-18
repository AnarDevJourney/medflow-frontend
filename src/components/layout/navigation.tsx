import { DashboardOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { ALL_ROLES, type Role } from "@models/enums";
import { PATHS } from "@router/paths";

// Sidebar entries. `roles` = who sees the entry (the same roles the backend
// allows); each module adds its pages here (patients, appointments, …).
export interface NavItem {
  key: string;
  path: string;
  labelKey: string; // i18n key
  icon: ReactNode;
  roles: readonly Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    path: PATHS.home,
    labelKey: "nav.dashboard",
    icon: <DashboardOutlined />,
    roles: ALL_ROLES,
  },
];
