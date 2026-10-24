import {
  MailOutlined,
  StopOutlined,
  UndoOutlined,
  UserAddOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Select, Tooltip } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@components/data-table";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { PageHeader } from "@components/ui/PageHeader";
import { RoleTag } from "@components/ui/RoleTag";
import { SearchInput } from "@components/ui/SearchInput";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { formatDate, formatDateTime, fromNow } from "@lib/dayjs";
import { UserStatus, type Role } from "@models/enums";
import { USER_STATUS_COLOR } from "@utils/statusColors";
import { InviteUserModal } from "../components/InviteUserModal";
import { StaffDetailDrawer } from "../components/StaffDetailDrawer";
import { RoleSelect } from "../components/RoleSelect";
import { UserModal } from "../components/UserModal";
import { useConfirmUserAction } from "../hooks/useConfirmUserAction";
import { useUsers } from "../hooks/useUsers";
import type { StaffUser } from "../services/usersService";
import styles from "./StaffPage.module.css";

// DataTable column key → API sort field
const SORT_FIELDS: Record<string, string> = {
  name: "lastName",
  email: "email",
  lastLoginAt: "lastLoginAt",
  createdAt: "createdAt",
};

// ADMIN user management on auth-service /users.
// TODO(phase 5): all-roles staff directory with department and title.
export function StaffPage() {
  const { t } = useTranslation();
  const { data: me } = useCurrentUser();
  const { resend, deactivate, reactivate } = useConfirmUserAction();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role>();
  const [status, setStatus] = useState<UserStatus>();
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const users = useUsers({
    page,
    limit: pageSize,
    role,
    status,
    search: search || undefined,
    sort: sort ? `${SORT_FIELDS[sort.key]}:${sort.order}` : undefined,
  });
  // Always the fresh row (the list refetches after every action)
  const findUser = (id: string | null) =>
    users.data?.items.find((u) => u.id === id) ?? null;
  const filtersActive = Boolean(search || role || status);

  const columns = useMemo<DataTableColumn<StaffUser>[]>(
    () => [
      {
        key: "name",
        title: t("staff.columns.name"),
        width: 280,
        hideable: false,
        sortable: true,
        render: (_, u) => (
          <span className={styles.person}>
            <UserAvatar firstName={u.firstName} lastName={u.lastName} size={28} />
            <span className={styles.personText}>
              <span className={styles.personName}>
                {u.firstName} {u.lastName}
                {u.id === me?.id && <span className={styles.you}>{t("staff.you")}</span>}
              </span>
              <span className={styles.personEmail}>{u.email}</span>
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
        key: "status",
        title: t("staff.columns.status"),
        dataIndex: "status",
        width: 160,
        render: (value) => <UserStatusTag status={value as UserStatus} />,
      },
      {
        key: "lastLoginAt",
        title: t("staff.lastLogin"),
        dataIndex: "lastLoginAt",
        width: 170,
        sortable: true,
        render: (value) =>
          value ? (
            <Tooltip title={formatDateTime(String(value))}>
              <span>{fromNow(String(value))}</span>
            </Tooltip>
          ) : (
            <span className={styles.muted}>{t("staff.never")}</span>
          ),
      },
      {
        key: "createdAt",
        title: t("staff.createdAt"),
        dataIndex: "createdAt",
        width: 150,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) => formatDate(String(value)),
      },
    ],
    [t, me?.id],
  );

  const resetFilters = () => {
    setSearch("");
    setRole(undefined);
    setStatus(undefined);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        subtitle={t("staff.subtitle")}
        actions={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setInviteOpen(true)}
          >
            {t("staff.inviteButton")}
          </Button>
        }
      />
      <DataTable<StaffUser>
        tableKey="staff"
        columns={columns}
        data={users.data?.items}
        rowKey="id"
        loading={users.isFetching}
        error={users.error}
        onRetry={() => void users.refetch()}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{
          page,
          pageSize,
          total: users.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        onRowClick={(u) => setDetailsId(u.id)}
        onViewDetails={(u) => setDetailsId(u.id)}
        rowLabel={(u) => `${u.firstName} ${u.lastName}`}
        rowActions={(u) => [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: t("staff.edit"),
            onClick: () => setEditId(u.id),
          },
          ...(u.status === "INVITED"
            ? [
                {
                  key: "resend",
                  icon: <MailOutlined />,
                  label: t("staff.resendInvite"),
                  onClick: () => resend(u),
                },
              ]
            : []),
          "divider",
          u.status === "DEACTIVATED"
            ? {
                key: "reactivate",
                icon: <UndoOutlined />,
                label: t("staff.reactivate"),
                onClick: () => reactivate(u),
              }
            : {
                key: "deactivate",
                icon: <StopOutlined />,
                label: t("staff.deactivate"),
                danger: true,
                disabled: u.id === me?.id,
                onClick: () => deactivate(u),
              },
        ]}
        rowAccent={(u) => USER_STATUS_COLOR[u.status]}
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
                description: t("staff.emptyText"),
                action: (
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
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              className={styles.search}
            />
            <RoleSelect
              allowClear
              placeholder={t("staff.allRoles")}
              value={role}
              onChange={(value) => {
                setRole(value);
                setPage(1);
              }}
              className={styles.filter}
              aria-label={t("staff.role")}
            />
            <Select<UserStatus>
              allowClear
              placeholder={t("staff.allStatuses")}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={Object.values(UserStatus).map((s) => ({
                value: s,
                label: t(`userStatus.${s}`),
              }))}
              className={styles.filter}
              aria-label={t("staff.columns.status")}
            />
            <ClearFiltersButton active={filtersActive} onClear={resetFilters} />
          </>
        }
      />
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <StaffDetailDrawer
        user={findUser(detailsId)}
        onClose={() => setDetailsId(null)}
        onEdit={(u) => {
          setDetailsId(null);
          setEditId(u.id);
        }}
      />
      <UserModal user={findUser(editId)} onClose={() => setEditId(null)} />
    </>
  );
}
