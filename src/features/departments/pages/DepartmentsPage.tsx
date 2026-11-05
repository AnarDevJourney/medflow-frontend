import {
  EditOutlined,
  PlusOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Select } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
  type DataTableSort,
} from "@components/data-table";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { PageHeader } from "@components/ui/PageHeader";
import { SearchInput } from "@components/ui/SearchInput";
import { formatDate } from "@lib/dayjs";
import { DepartmentDetailDrawer } from "../components/DepartmentDetailDrawer";
import { DepartmentModal } from "../components/DepartmentModal";
import { DepartmentStatusTag } from "../components/DepartmentStatusTag";
import { useConfirmDepartmentAction } from "../hooks/useConfirmDepartmentAction";
import { useDepartments } from "../hooks/useDepartments";
import type { Department } from "../services/departmentsService";
import styles from "./DepartmentsPage.module.css";

type StatusFilter = "active" | "inactive";

// DataTable column key → API sort field
const SORT_FIELDS: Record<string, string> = {
  name: "name",
  code: "code",
  createdAt: "createdAt",
};

// The route needs departments.manage, so every action here is allowed
export function DepartmentsPage() {
  const { t } = useTranslation();
  const { deactivate, reactivate } = useConfirmDepartmentAction();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>();
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const departments = useDepartments({
    page,
    limit: pageSize,
    search: search || undefined,
    isActive: status ? status === "active" : undefined,
    sort: sort ? `${SORT_FIELDS[sort.key]}:${sort.order}` : undefined,
  });
  // Always the fresh row (the list refetches after every action)
  const findDepartment = (id: string | null) =>
    departments.data?.items.find((d) => d.id === id) ?? null;
  const editing = findDepartment(editId);
  const filtersActive = Boolean(search || status);

  const columns = useMemo<DataTableColumn<Department>[]>(
    () => [
      {
        key: "name",
        title: t("departments.columns.name"),
        width: 300,
        hideable: false,
        sortable: true,
        render: (_, d) => (
          <span className={styles.nameCell}>
            <span className={styles.name}>{d.name}</span>
            {d.description && <span className={styles.description}>{d.description}</span>}
          </span>
        ),
      },
      {
        key: "code",
        title: t("departments.columns.code"),
        dataIndex: "code",
        width: 110,
        sortable: true,
        render: (value) => <span className={styles.code}>{String(value)}</span>,
      },
      {
        key: "location",
        title: t("departments.columns.location"),
        dataIndex: "location",
        width: 220,
        render: (value) =>
          value ? String(value) : <span className={styles.muted}>—</span>,
      },
      {
        key: "phone",
        title: t("departments.columns.phone"),
        dataIndex: "phone",
        width: 170,
        render: (value) =>
          value ? String(value) : <span className={styles.muted}>—</span>,
      },
      {
        key: "status",
        title: t("departments.columns.status"),
        dataIndex: "isActive",
        width: 130,
        render: (value) => <DepartmentStatusTag isActive={Boolean(value)} />,
      },
      {
        key: "createdAt",
        title: t("departments.columns.createdAt"),
        dataIndex: "createdAt",
        width: 150,
        numeric: true,
        align: "left",
        sortable: true,
        defaultHidden: true,
        render: (value) => formatDate(String(value)),
      },
    ],
    [t],
  );

  const resetFilters = () => {
    setSearch("");
    setStatus(undefined);
    setPage(1);
  };

  const addButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
      {t("departments.addButton")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("departments.title")}
        subtitle={t("departments.subtitle")}
        actions={addButton}
      />
      <DataTable<Department>
        tableKey="departments"
        columns={columns}
        data={departments.data?.items}
        rowKey="id"
        loading={departments.isFetching}
        error={departments.error}
        onRetry={() => void departments.refetch()}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{
          page,
          pageSize,
          total: departments.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        onRowClick={(d) => setDetailsId(d.id)}
        onViewDetails={(d) => setDetailsId(d.id)}
        rowLabel={(d) => d.name}
        rowActions={(d) => {
          const edit: DataTableRowAction = {
            key: "edit",
            icon: <EditOutlined />,
            label: t("departments.edit"),
            onClick: () => setEditId(d.id),
          };
          const toggle: DataTableRowAction = d.isActive
            ? {
                key: "deactivate",
                icon: <StopOutlined />,
                label: t("departments.deactivate"),
                danger: true,
                onClick: () => deactivate(d),
              }
            : {
                key: "reactivate",
                icon: <UndoOutlined />,
                label: t("departments.reactivate"),
                onClick: () => reactivate(d),
              };
          return [edit, "divider", toggle];
        }}
        rowAccent={(d) => (d.isActive ? "var(--color-success)" : "var(--color-muted)")}
        empty={
          filtersActive
            ? {
                title: t("departments.noMatchTitle"),
                description: t("departments.noMatchText"),
                action: (
                  <Button onClick={resetFilters}>{t("common.clearFilters")}</Button>
                ),
              }
            : {
                title: t("departments.emptyTitle"),
                description: t("departments.emptyText"),
                action: addButton,
              }
        }
        toolbar={
          <>
            <SearchInput
              placeholder={t("departments.search")}
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              className={styles.search}
            />
            <Select<StatusFilter>
              allowClear
              placeholder={t("departments.allStatuses")}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { value: "active", label: t("departments.status.active") },
                { value: "inactive", label: t("departments.status.inactive") },
              ]}
              className={styles.filter}
              aria-label={t("departments.columns.status")}
            />
            <ClearFiltersButton active={filtersActive} onClear={resetFilters} />
          </>
        }
      />
      <DepartmentModal
        open={createOpen || Boolean(editing)}
        department={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
      />
      <DepartmentDetailDrawer
        department={findDepartment(detailsId)}
        onClose={() => setDetailsId(null)}
        onEdit={(d) => {
          setDetailsId(null);
          setEditId(d.id);
        }}
      />
    </>
  );
}
