import {
  AuditOutlined,
  BellOutlined,
  CalendarOutlined,
  ClusterOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { ALL_ROLES, Role, type Role as RoleType } from "@models/enums";
import { PATHS } from "@router/paths";

// Built-in sidebar groups. Users can rename, reorder, delete them and add
// their own (saved per user in configurations-service).
export const NAV_GROUP_IDS = ["main", "clinical", "finance", "admin"] as const;
export type NavGroupId = (typeof NAV_GROUP_IDS)[number];

// Sidebar entries (DOC 9.1). `key` is stored in the user's sidebar settings —
// never rename one. `roles` = who sees the entry (the same roles the backend
// allows); `group` = the built-in group it starts in.
export interface NavItem {
  key: string;
  path: string;
  labelKey: string; // i18n key
  icon: ReactNode;
  roles: readonly RoleType[];
  group: NavGroupId;
}

const { ADMIN, DOCTOR, NURSE, RECEPTIONIST, ACCOUNTANT } = Role;

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    path: PATHS.home,
    labelKey: "nav.dashboard",
    icon: <DashboardOutlined />,
    roles: ALL_ROLES,
    group: "main",
  },
  {
    key: "today",
    path: PATHS.today,
    labelKey: "nav.today",
    icon: <FieldTimeOutlined />,
    roles: [DOCTOR],
    group: "main",
  },
  {
    key: "notifications",
    path: PATHS.notifications,
    labelKey: "nav.notifications",
    icon: <BellOutlined />,
    roles: ALL_ROLES,
    group: "main",
  },
  {
    key: "patients",
    path: PATHS.patients,
    labelKey: "nav.patients",
    icon: <UserOutlined />,
    roles: [ADMIN, DOCTOR, NURSE, RECEPTIONIST],
    group: "clinical",
  },
  {
    key: "appointments",
    path: PATHS.appointments,
    labelKey: "nav.appointments",
    icon: <CalendarOutlined />,
    roles: [ADMIN, DOCTOR, NURSE, RECEPTIONIST],
    group: "clinical",
  },
  {
    key: "lab-queue",
    path: PATHS.labQueue,
    labelKey: "nav.labQueue",
    icon: <ExperimentOutlined />,
    roles: [NURSE],
    group: "clinical",
  },
  {
    key: "invoices",
    path: PATHS.invoices,
    labelKey: "nav.invoices",
    icon: <FileTextOutlined />,
    roles: [ADMIN, RECEPTIONIST, ACCOUNTANT],
    group: "finance",
  },
  {
    key: "prices",
    path: PATHS.prices,
    labelKey: "nav.prices",
    icon: <TagsOutlined />,
    roles: [ADMIN, ACCOUNTANT],
    group: "finance",
  },
  {
    key: "staff",
    path: PATHS.staff,
    labelKey: "nav.staff",
    icon: <TeamOutlined />,
    roles: ALL_ROLES,
    group: "admin",
  },
  {
    key: "departments",
    path: PATHS.departments,
    labelKey: "nav.departments",
    icon: <ClusterOutlined />,
    roles: [ADMIN],
    group: "admin",
  },
  {
    key: "history",
    path: PATHS.history,
    labelKey: "nav.history",
    icon: <AuditOutlined />,
    roles: [ADMIN],
    group: "admin",
  },
];

// The nav entry a URL belongs to: longest matching path wins
// ("/settings/prices/x" → prices, "/" only for exactly "/")
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) =>
    item.path === "/"
      ? pathname === "/"
      : pathname === item.path || pathname.startsWith(`${item.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0];
}
