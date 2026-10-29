import { api } from "@lib/api/client";
import type { Role } from "@models/enums";
import type { Permission, PermissionGroup } from "@models/permissions";

export type RolePermissions = Record<Role, Permission[]>;

export interface MyPermissions {
  role: Role;
  permissions: Permission[];
}

// Everything the permissions page needs (labels are translated here)
export interface PermissionsMatrix {
  groups: PermissionGroup[];
  permissions: { code: Permission; group: PermissionGroup }[];
  locked: Partial<RolePermissions>; // checkboxes that can't be unticked
  roles: RolePermissions;
}

// GET /configurations/permissions/me — the signed-in user's permissions
export async function getMyPermissions(): Promise<MyPermissions> {
  const { data } = await api.get<MyPermissions>("/configurations/permissions/me");
  return data;
}

export async function getPermissionsMatrix(): Promise<PermissionsMatrix> {
  const { data } = await api.get<PermissionsMatrix>("/configurations/permissions");
  return data;
}

// Full list per sent role; other roles stay as they are
export async function updateRolePermissions(
  roles: Partial<RolePermissions>,
): Promise<Partial<RolePermissions>> {
  const { data } = await api.put<Partial<RolePermissions>>(
    "/configurations/permissions",
    { roles },
  );
  return data;
}
