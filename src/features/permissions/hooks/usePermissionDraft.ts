import { useCallback, useMemo, useState } from "react";
import { ALL_ROLES, type Role } from "@models/enums";
import type { Permission } from "@models/permissions";
import type { PermissionsMatrix, RolePermissions } from "../services/permissionsService";

type CellKey = `${Role}|${Permission}`;
const cellKey = (role: Role, code: Permission): CellKey => `${role}|${code}`;

export interface PermissionDraft {
  isGranted: (role: Role, code: Permission) => boolean;
  isChanged: (role: Role, code: Permission) => boolean;
  set: (cells: { role: Role; code: Permission }[], granted: boolean) => void;
  reset: () => void;
  changeCount: number;
  changedRoles: Role[];
  // Full lists of the changed roles — the body of PUT /configurations/permissions
  changedLists: () => Partial<RolePermissions>;
}

// Unsaved checkbox changes on top of the server's matrix. Only differences
// are kept, so when the server catches up (another admin, a socket update)
// a change that now matches it simply stops counting.
export function usePermissionDraft(
  matrix: PermissionsMatrix | undefined,
): PermissionDraft {
  const [changes, setChanges] = useState<ReadonlyMap<CellKey, boolean>>(new Map());

  const server = useMemo(
    () =>
      new Set(
        matrix
          ? ALL_ROLES.flatMap((role) =>
              matrix.roles[role].map((code) => cellKey(role, code)),
            )
          : [],
      ),
    [matrix],
  );

  // Changes that still differ from the server
  const pending = useMemo(
    () => new Map([...changes].filter(([key, granted]) => server.has(key) !== granted)),
    [changes, server],
  );

  const isGranted = useCallback(
    (role: Role, code: Permission) => {
      const key = cellKey(role, code);
      return pending.get(key) ?? server.has(key);
    },
    [pending, server],
  );

  const isChanged = useCallback(
    (role: Role, code: Permission) => pending.has(cellKey(role, code)),
    [pending],
  );

  const set = useCallback(
    (cells: { role: Role; code: Permission }[], granted: boolean) =>
      setChanges((current) => {
        const next = new Map(current);
        for (const { role, code } of cells) {
          const key = cellKey(role, code);
          if (server.has(key) === granted) next.delete(key);
          else next.set(key, granted);
        }
        return next;
      }),
    [server],
  );

  const reset = useCallback(() => setChanges(new Map()), []);

  const changedRoles = useMemo(
    () =>
      ALL_ROLES.filter((role) =>
        [...pending.keys()].some((key) => key.startsWith(`${role}|`)),
      ),
    [pending],
  );

  const changedLists = useCallback(() => {
    if (!matrix) return {};
    return Object.fromEntries(
      changedRoles.map((role) => [
        role,
        matrix.permissions.map((p) => p.code).filter((code) => isGranted(role, code)),
      ]),
    ) as Partial<RolePermissions>;
  }, [matrix, changedRoles, isGranted]);

  return {
    isGranted,
    isChanged,
    set,
    reset,
    changeCount: pending.size,
    changedRoles,
    changedLists,
  };
}
