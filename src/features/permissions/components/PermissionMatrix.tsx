import { DownOutlined, LockOutlined } from "@ant-design/icons";
import { Checkbox, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { RoleTag } from "@components/ui/RoleTag";
import { ALL_ROLES, type Role } from "@models/enums";
import type { Permission, PermissionGroup } from "@models/permissions";
import type { PermissionDraft } from "../hooks/usePermissionDraft";
import styles from "./PermissionMatrix.module.css";

export interface MatrixSection {
  group: PermissionGroup;
  codes: Permission[];
}

interface PermissionMatrixProps {
  sections: MatrixSection[];
  draft: PermissionDraft;
  locked: (role: Role, code: Permission) => boolean;
  editable: boolean;
  catalog: readonly Permission[]; // every permission (role header counts)
  collapsed: ReadonlySet<PermissionGroup>;
  onToggleGroup: (group: PermissionGroup) => void;
}

// Permissions as rows (grouped by module), roles as columns, a checkbox in
// every cell. A changed cell is tinted until it is saved; locked cells
// (ADMIN's access to this page) can't be unticked.
export function PermissionMatrix({
  sections,
  draft,
  locked,
  editable,
  catalog,
  collapsed,
  onToggleGroup,
}: PermissionMatrixProps) {
  const { t } = useTranslation();
  const label = (code: Permission) => t(`permissionCatalog.${code}.label`);

  const total = catalog.length;
  const grantedCount = (role: Role) =>
    catalog.filter((code) => draft.isGranted(role, code)).length;

  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <colgroup>
          <col />
          {ALL_ROLES.map((role) => (
            <col key={role} className={styles.roleCol} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}>
              {t("permissionsPage.permissionColumn")}
            </th>
            {ALL_ROLES.map((role) => {
              const count = grantedCount(role);
              return (
                <th key={role} scope="col" className={styles.roleHead}>
                  <span className={styles.roleHeadInner}>
                    <RoleTag role={role} />
                    <span
                      className={styles.count}
                      aria-label={t("permissionsPage.grantedLabel", {
                        role: t(`roles.${role}`),
                        count,
                        total,
                      })}
                    >
                      {t("permissionsPage.granted", { count, total })}
                      {draft.changedRoles.includes(role) && (
                        <span className={styles.dot} aria-hidden="true" />
                      )}
                    </span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        {sections.map(({ group, codes }) => {
          const isCollapsed = collapsed.has(group);
          const groupName = t(`permissionGroups.${group}`);
          return (
            <tbody key={group} className={styles.section}>
              <tr className={styles.groupRow}>
                <th scope="rowgroup" className={styles.groupHead}>
                  <button
                    type="button"
                    className={styles.groupToggle}
                    aria-expanded={!isCollapsed}
                    aria-label={t(
                      isCollapsed
                        ? "permissionsPage.expandGroup"
                        : "permissionsPage.collapseGroup",
                    )}
                    onClick={() => onToggleGroup(group)}
                  >
                    <DownOutlined
                      className={`${styles.chevron} ${isCollapsed ? styles.chevronClosed : ""}`}
                      aria-hidden="true"
                    />
                    <span className={styles.groupName}>{groupName}</span>
                    <span className={styles.groupCount}>
                      {t("permissionsPage.groupCount", { count: codes.length })}
                    </span>
                  </button>
                </th>
                {ALL_ROLES.map((role) => {
                  const editableCodes = codes.filter((code) => !locked(role, code));
                  const granted = codes.filter((code) => draft.isGranted(role, code));
                  const all = granted.length === codes.length;
                  return (
                    <td key={role} className={styles.groupCell}>
                      {editable && editableCodes.length > 0 && (
                        <Tooltip
                          title={t("permissionsPage.groupToggle", {
                            group: groupName,
                            role: t(`roles.${role}`),
                          })}
                          mouseEnterDelay={0.4}
                        >
                          <Checkbox
                            checked={all}
                            indeterminate={granted.length > 0 && !all}
                            aria-label={t("permissionsPage.groupToggle", {
                              group: groupName,
                              role: t(`roles.${role}`),
                            })}
                            onChange={(e) =>
                              draft.set(
                                editableCodes.map((code) => ({ role, code })),
                                e.target.checked,
                              )
                            }
                          />
                        </Tooltip>
                      )}
                    </td>
                  );
                })}
              </tr>

              {!isCollapsed &&
                codes.map((code) => (
                  <tr key={code} className={styles.row}>
                    <th scope="row" className={styles.permission}>
                      <span className={styles.permissionLabel}>{label(code)}</span>
                      <span className={styles.permissionText}>
                        {t(`permissionCatalog.${code}.description`)}
                      </span>
                    </th>
                    {ALL_ROLES.map((role) => (
                      <MatrixCell
                        key={role}
                        role={role}
                        code={code}
                        label={label(code)}
                        draft={draft}
                        locked={locked(role, code)}
                        editable={editable}
                      />
                    ))}
                  </tr>
                ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function MatrixCell({
  role,
  code,
  label,
  draft,
  locked,
  editable,
}: {
  role: Role;
  code: Permission;
  label: string;
  draft: PermissionDraft;
  locked: boolean;
  editable: boolean;
}) {
  const { t } = useTranslation();
  const changed = draft.isChanged(role, code);
  const ariaLabel = t("permissionsPage.cellLabel", {
    role: t(`roles.${role}`),
    permission: label,
  });

  return (
    <td className={`${styles.cell} ${changed ? styles.changed : ""}`}>
      {locked ? (
        <Tooltip title={t("permissionsPage.locked")}>
          <span className={styles.locked}>
            <Checkbox checked disabled aria-label={ariaLabel} />
            <LockOutlined className={styles.lockIcon} aria-hidden="true" />
          </span>
        </Tooltip>
      ) : (
        <Checkbox
          checked={draft.isGranted(role, code)}
          disabled={!editable}
          aria-label={
            changed ? `${ariaLabel} (${t("permissionsPage.changed")})` : ariaLabel
          }
          onChange={(e) => draft.set([{ role, code }], e.target.checked)}
        />
      )}
    </td>
  );
}
