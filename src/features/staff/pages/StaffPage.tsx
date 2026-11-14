import {
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  StopOutlined,
  UndoOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Button, Select } from "antd";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
  type DataTableSort,
} from "@components/data-table";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { PageHeader } from "@components/ui/PageHeader";
import { RoleTag } from "@components/ui/RoleTag";
import { SearchInput } from "@components/ui/SearchInput";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { formatDate, formatDay } from "@lib/dayjs";
import { UserStatus, type Role } from "@models/enums";
import { USER_STATUS_COLOR } from "@utils/statusColors";
import { staffMemberPath } from "@router/paths";
import { InviteUserModal } from "../components/InviteUserModal";
import { RoleSelect } from "../components/RoleSelect";
import { StaffProfileModal } from "../components/StaffProfileModal";
import { UserModal } from "../components/UserModal";
import { useConfirmUserAction } from "../hooks/useConfirmUserAction";
import { useStaff } from "../hooks/useStaff";
import type { StaffMember } from "../services/staffService";
import styles from "./StaffPage.module.css";

// DataTable column key → API sort field
const SORT_FIELDS: Record<string, string> = {
  name: "name",
  email: "email",
  department: "department",
  status: "status",
  hireDate: "hireDate",
  createdAt: "createdAt",
};

const parseSort = (value: string | null): DataTableSort | null => {
  const [key, order] = value?.split(":") ?? [];
  return key && key in SORT_FIELDS && (order === "asc" || order === "desc")
    ? { key, order }
    : null;
};

// Staff directory for every role (staff-service, staff.read). Without
// users.read only active people are listed and account status stays hidden;
// account actions (invite, edit, deactivate) and the work profile edit show
// only with their permissions.
export function StaffPage() {
  const { t } = useTranslation();
  const { data: me } = useCurrentUser();
  const can = useCan();
  const canReadAccounts = can("users.read");
  const canInvite = can("users.invite");
  const canEditAccount = canReadAccounts && can("users.update");
  const canDeactivate = can("users.deactivate");
  const canEditProfile = can("staff.update");
  const { resend, deactivate, reactivate } = useConfirmUserAction();
  // Filters, sort and page live in the URL, so the person page's back link
  // (and a reload) returns to the same list
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const search = params.get("q") ?? "";
  const role = (params.get("role") as Role | null) ?? undefined;
  const departmentId = params.get("department") ?? undefined;
  const status = (params.get("status") as UserStatus | null) ?? undefined;
  const sort = parseSort(params.get("sort"));
  const page = Number(params.get("page")) || 1;
  const pageSize = Number(params.get("size")) || 20;
  // Writes the given keys (undefined removes one); filters go back to page 1
  const update = (patch: Record<string, string | number | undefined>, keepPage = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === "") next.delete(key);
          else next.set(key, String(value));
        }
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace: true },
    );
  const setSearch = (value: string) => update({ q: value });
  const setRole = (value: Role | undefined) => update({ role: value });
  const setDepartmentId = (value: string | undefined) => update({ department: value });
  const setStatus = (value: UserStatus | undefined) => update({ status: value });
  const setSort = (value: DataTableSort | null) =>
    update({ sort: value ? `${value.key}:${value.order}` : undefined });
  const openPerson = (s: StaffMember) =>
    navigate(staffMemberPath(s.userId), { state: { from: location.search } });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const staff = useStaff({
    page,
    limit: pageSize,
    role,
    departmentId,
    status: canReadAccounts ? status : undefined,
    search: search || undefined,
    sort: sort ? `${SORT_FIELDS[sort.key]}:${sort.order}` : undefined,
  });
  // Always the fresh row (the list refetches after every action)
  const findStaff = (userId: string | null) =>
    staff.data?.items.find((s) => s.userId === userId) ?? null;
  const filtersActive = Boolean(search || role || departmentId || status);

  const columns = useMemo<DataTableColumn<StaffMember>[]>(
    () => [
      {
        key: "name",
        title: t("staff.columns.name"),
        width: 280,
        hideable: false,
        sortable: true,
        render: (_, s) => (
          <span className={styles.person}>
            <UserAvatar firstName={s.firstName} lastName={s.lastName} size={28} />
            <span className={styles.personText}>
              <span className={styles.personName}>
                {s.firstName} {s.lastName}
                {s.userId === me?.id && (
                  <span className={styles.you}>{t("staff.you")}</span>
                )}
              </span>
              <span className={styles.personEmail}>{s.email}</span>
            </span>
          </span>
        ),
      },
      {
        key: "email",
        title: t("auth.email"),
        dataIndex: "email",
        width: 240,
        sortable: true,
        defaultHidden: true,
      },
      {
        key: "role",
        title: t("staff.role"),
        dataIndex: "role",
        width: 170,
        render: (value) => <RoleTag role={value as Role} />,
      },
      {
        key: "department",
        title: t("staff.profile.department"),
        width: 190,
        sortable: true,
        render: (_, s) =>
          s.department ? (
            <span className={s.department.isActive ? undefined : styles.muted}>
              {s.department.name}
            </span>
          ) : (
            <span className={styles.muted}>—</span>
          ),
      },
      {
        key: "title",
        title: t("staff.profile.title"),
        dataIndex: "title",
        width: 200,
        render: (value) =>
          value ? String(value) : <span className={styles.muted}>—</span>,
      },
      ...(canReadAccounts
        ? [
            {
              key: "status",
              title: t("staff.columns.status"),
              dataIndex: "status",
              width: 160,
              sortable: true,
              render: (value: unknown) => <UserStatusTag status={value as UserStatus} />,
            } satisfies DataTableColumn<StaffMember>,
          ]
        : []),
      {
        key: "phone",
        title: t("staff.profile.phone"),
        dataIndex: "phone",
        width: 170,
        defaultHidden: true,
        render: (value) =>
          value ? String(value) : <span className={styles.muted}>—</span>,
      },
      {
        key: "hireDate",
        title: t("staff.profile.hireDate"),
        dataIndex: "hireDate",
        width: 150,
        numeric: true,
        align: "left",
        sortable: true,
        defaultHidden: true,
        render: (value) =>
          value ? formatDay(String(value)) : <span className={styles.muted}>—</span>,
      },
      {
        key: "createdAt",
        title: t("staff.createdAt"),
        dataIndex: "createdAt",
        width: 150,
        numeric: true,
        align: "left",
        sortable: true,
        defaultHidden: !canReadAccounts,
        render: (value) => formatDate(String(value)),
      },
    ],
    [t, me?.id, canReadAccounts],
  );

  const resetFilters = () =>
    update({ q: undefined, role: undefined, department: undefined, status: undefined });

  // The confirmations take the account id (= userId)
  const account = (s: StaffMember) => ({ ...s, id: s.userId });

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        subtitle={t(canInvite ? "staff.subtitle" : "staff.directorySubtitle")}
        actions={
          canInvite && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setInviteOpen(true)}
            >
              {t("staff.inviteButton")}
            </Button>
          )
        }
      />
      <DataTable<StaffMember>
        tableKey="staff"
        columns={columns}
        data={staff.data?.items}
        rowKey="userId"
        loading={staff.isFetching}
        error={staff.error}
        onRetry={() => void staff.refetch()}
        sort={sort}
        onSortChange={setSort}
        pagination={{
          page,
          pageSize,
          total: staff.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) =>
            update(
              {
                page: nextSize === pageSize && nextPage > 1 ? nextPage : undefined,
                size: nextSize === 20 ? undefined : nextSize,
              },
              true,
            ),
        }}
        onRowClick={openPerson}
        onViewDetails={openPerson}
        rowLabel={(s) => `${s.firstName} ${s.lastName}`}
        rowActions={(s) => {
          const edits: DataTableRowAction[] = [
            ...(canEditProfile
              ? [
                  {
                    key: "profile",
                    icon: <IdcardOutlined />,
                    label: t("staff.editProfile"),
                    onClick: () => setProfileId(s.userId),
                  },
                ]
              : []),
            ...(canEditAccount
              ? [
                  {
                    key: "account",
                    icon: <EditOutlined />,
                    label: t("staff.editAccount"),
                    onClick: () => setAccountId(s.userId),
                  },
                ]
              : []),
            ...(canInvite && s.status === "INVITED"
              ? [
                  {
                    key: "resend",
                    icon: <MailOutlined />,
                    label: t("staff.resendInvite"),
                    onClick: () => resend(account(s)),
                  },
                ]
              : []),
          ];
          if (!canDeactivate) return edits;
          const statusAction: DataTableRowAction =
            s.status === "DEACTIVATED"
              ? {
                  key: "reactivate",
                  icon: <UndoOutlined />,
                  label: t("staff.reactivate"),
                  onClick: () => reactivate(account(s)),
                }
              : {
                  key: "deactivate",
                  icon: <StopOutlined />,
                  label: t("staff.deactivate"),
                  danger: true,
                  disabled: s.userId === me?.id,
                  onClick: () => deactivate(account(s)),
                };
          return edits.length > 0 ? [...edits, "divider", statusAction] : [statusAction];
        }}
        rowAccent={canReadAccounts ? (s) => USER_STATUS_COLOR[s.status] : undefined}
        empty={
          filtersActive
            ? {
                title: t("staff.noMatchTitle"),
                description: t("staff.noMatchText"),
                action: (
                  <Button onClick={resetFilters}>{t("common.clearFilters")}</Button>
                ),
              }
            : {
                title: t("staff.emptyTitle"),
                description: t(
                  canInvite ? "staff.emptyText" : "staff.emptyDirectoryText",
                ),
                action: canInvite && (
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setInviteOpen(true)}
                  >
                    {t("staff.inviteButton")}
                  </Button>
                ),
              }
        }
        toolbar={
          <>
            <SearchInput
              placeholder={t("staff.search")}
              value={search}
              onChange={setSearch}
              className={styles.search}
            />
            <RoleSelect
              allowClear
              placeholder={t("staff.allRoles")}
              value={role}
              onChange={setRole}
              className={styles.filter}
              aria-label={t("staff.role")}
            />
            <DepartmentSelect
              allowClear
              placeholder={t("staff.allDepartments")}
              value={departmentId}
              onChange={setDepartmentId}
              className={styles.filter}
              aria-label={t("staff.profile.department")}
            />
            {canReadAccounts && (
              <Select<UserStatus>
                allowClear
                placeholder={t("staff.allStatuses")}
                value={status}
                onChange={setStatus}
                options={Object.values(UserStatus).map((s) => ({
                  value: s,
                  label: t(`userStatus.${s}`),
                }))}
                className={styles.filter}
                aria-label={t("staff.columns.status")}
              />
            )}
            <ClearFiltersButton active={filtersActive} onClear={resetFilters} />
          </>
        }
      />
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <StaffProfileModal
        staff={findStaff(profileId)}
        onClose={() => setProfileId(null)}
      />
      <UserModal userId={accountId} onClose={() => setAccountId(null)} />
    </>
  );
}
