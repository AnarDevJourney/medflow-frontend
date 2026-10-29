import {
  AuditOutlined,
  BellOutlined,
  CalendarOutlined,
  ClusterOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import type { PermissionCheck } from "@features/permissions/hooks/usePermissions";
import { PATHS } from "@router/paths";

// Built-in sidebar groups. Users can rename, reorder, delete them and add
// their own (saved per user in configurations-service).
export const NAV_GROUP_IDS = ["main", "clinical", "finance", "admin"] as const;
export type NavGroupId = (typeof NAV_GROUP_IDS)[number];

// Sidebar entries (DOC 9.1). `key` is stored in the user's sidebar settings —
// never rename one. `permission` = what the entry needs (the backend checks
// the same; a list = any of them, none = every signed-in user); `group` =
// the built-in group it starts in.
export interface NavItem {
  key: string;
  path: string;
  labelKey: string; // i18n key
  icon: ReactNode;
  permission?: PermissionCheck;
  group: NavGroupId;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    path: PATHS.home,
    labelKey: "nav.dashboard",
    icon: <DashboardOutlined />,
    group: "main",
  },
  {
    key: "today",
    path: PATHS.today,
    labelKey: "nav.today",
    icon: <FieldTimeOutlined />,
    permission: "encounters.manage",
    group: "main",
  },
  {
    key: "notifications",
    path: PATHS.notifications,
    labelKey: "nav.notifications",
    icon: <BellOutlined />,
    group: "main",
  },
  {
    key: "patients",
    path: PATHS.patients,
    labelKey: "nav.patients",
    icon: <UserOutlined />,
    permission: "patients.read",
    group: "clinical",
  },
  {
    key: "appointments",
    path: PATHS.appointments,
    labelKey: "nav.appointments",
    icon: <CalendarOutlined />,
    permission: "appointments.read",
    group: "clinical",
  },
  {
    key: "lab-queue",
    path: PATHS.labQueue,
    labelKey: "nav.labQueue",
    icon: <ExperimentOutlined />,
    permission: "lab.process",
    group: "clinical",
  },
  {
    key: "invoices",
    path: PATHS.invoices,
    labelKey: "nav.invoices",
    icon: <FileTextOutlined />,
    permission: "invoices.read",
    group: "finance",
  },
  {
    key: "prices",
    path: PATHS.prices,
    labelKey: "nav.prices",
    icon: <TagsOutlined />,
    permission: "prices.read",
    group: "finance",
  },
  {
    key: "staff",
    path: PATHS.staff,
    labelKey: "nav.staff",
    icon: <TeamOutlined />,
    // F1: user management on auth /users.
    // TODO(phase 5): staff directory for every role (DOC 9.1, staff.read).
    permission: "users.read",
    group: "admin",
  },
  {
    key: "departments",
    path: PATHS.departments,
    labelKey: "nav.departments",
    icon: <ClusterOutlined />,
    permission: "departments.manage",
    group: "admin",
  },
  {
    key: "history",
    path: PATHS.history,
    labelKey: "nav.history",
    icon: <AuditOutlined />,
    permission: ["history.read", "emails.read"],
    group: "admin",
  },
  {
    key: "permissions",
    path: PATHS.permissions,
    labelKey: "nav.permissions",
    icon: <SafetyCertificateOutlined />,
    permission: "permissions.read",
    group: "admin",
  },
];

export const permissionFor = (key: string): PermissionCheck | undefined =>
  NAV_ITEMS.find((item) => item.key === key)?.permission;

// The nav entry a URL belongs to: longest matching path wins
// ("/settings/prices/x" → prices, "/" only for exactly "/")
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) =>
    item.path === "/"
      ? pathname === "/"
      : pathname === item.path || pathname.startsWith(`${item.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0];
}
