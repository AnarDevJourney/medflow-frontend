import {
  EditOutlined,
  ManOutlined,
  StopOutlined,
  UndoOutlined,
  UserAddOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { Button, Flex, Select } from "antd";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { UserAvatar } from "@components/ui/UserAvatar";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { formatDate, formatDay } from "@lib/dayjs";
import { Gender, type BloodType } from "@models/enums";
import { PatientModal } from "../components/PatientModal";
import { PatientStatusTag } from "../components/PatientStatusTag";
import { useConfirmPatientAction } from "../hooks/useConfirmPatientAction";
import { usePatients } from "../hooks/usePatients";
import type { Patient } from "../services/patientsService";
import { ageOf, bloodTypeLabel, fullName } from "../utils/patient";
import styles from "./PatientsPage.module.css";

// DataTable column key → API sort field
const SORT_FIELDS: Record<string, string> = {
  name: "name",
  mrn: "mrn",
  age: "dateOfBirth",
  createdAt: "createdAt",
};

const parseSort = (value: string | null): DataTableSort | null => {
  const [key, order] = value?.split(":") ?? [];
  return key && key in SORT_FIELDS && (order === "asc" || order === "desc")
    ? { key, order }
    : null;
};

// Status filter: active records by default (duplicates / deceased hidden)
const STATUS_FILTERS = ["active", "inactive", "all"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const IS_ACTIVE: Record<StatusFilter, boolean | undefined> = {
  active: true,
  inactive: false,
  all: undefined,
};

// Search-first patient registry (DOC 6.1, 9.1): one box for name (typos
// allowed), MRN, FIN or phone — with a search the best match comes first.
// Filters, sort and page live in the URL.
export function PatientsPage() {
  const { t } = useTranslation();
  const can = useCan();
  const canCreate = can("patients.create");
  const canUpdate = can("patients.update");
  const canDeactivate = can("patients.deactivate");
  const { deactivate, reactivate } = useConfirmPatientAction();
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const gender = (params.get("gender") as Gender | null) ?? undefined;
  const statusParam = params.get("status") as StatusFilter | null;
  const status: StatusFilter =
    statusParam && STATUS_FILTERS.includes(statusParam) ? statusParam : "active";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const patients = usePatients({
    page,
    limit: pageSize,
    search: search || undefined,
    gender,
    isActive: IS_ACTIVE[status],
    sort: sort ? `${SORT_FIELDS[sort.key]}:${sort.order}` : undefined,
  });
  // Always the fresh row (the list refetches after every action)
  const findPatient = (id: string | null) =>
    patients.data?.items.find((p) => p.id === id) ?? null;
  const filtersActive = Boolean(search || gender || status !== "active");
  const resetFilters = () =>
    update({ q: undefined, gender: undefined, status: undefined });

  const columns = useMemo<DataTableColumn<Patient>[]>(
    () => [
      {
        key: "name",
        title: t("patients.columns.patient"),
        width: 260,
        hideable: false,
        sortable: true,
        render: (_, p) => (
          <span className={styles.person}>
            <UserAvatar firstName={p.firstName} lastName={p.lastName} size={28} />
            <span className={styles.personText}>
              <span className={styles.personName}>{fullName(p)}</span>
              {p.fatherName && (
                <span className={styles.personSub}>
                  {t("patients.fatherOf", { name: p.fatherName })}
                </span>
              )}
            </span>
          </span>
        ),
      },
      {
        key: "mrn",
        title: t("patients.fields.mrn"),
        dataIndex: "mrn",
        width: 110,
        sortable: true,
        render: (value) => <span className={styles.mrn}>{String(value)}</span>,
      },
      {
        key: "age",
        title: t("patients.columns.age"),
        width: 130,
        sortable: true,
        render: (_, p) => (
          <span className={styles.age}>
            <span>{t("patients.years", { count: ageOf(p.dateOfBirth) })}</span>
            <span className={styles.ageSub}>{formatDay(p.dateOfBirth)}</span>
          </span>
        ),
      },
      {
        key: "gender",
        title: t("patients.fields.gender"),
        dataIndex: "gender",
        width: 110,
        render: (value) => (
          <span className={styles.gender}>
            {value === Gender.FEMALE ? <WomanOutlined /> : <ManOutlined />}
            {t(`patients.gender.${String(value)}`)}
          </span>
        ),
      },
      {
        key: "phone",
        title: t("patients.fields.phone"),
        dataIndex: "phone",
        width: 170,
        render: (value) => <span className={styles.tabular}>{String(value)}</span>,
      },
      {
        key: "finCode",
        title: t("patients.fields.finCode"),
        dataIndex: "finCode",
        width: 110,
        render: (value) =>
          value ? (
            <span className={styles.tabular}>{String(value)}</span>
          ) : (
            <span className={styles.muted}>—</span>
          ),
      },
      {
        key: "bloodType",
        title: t("patients.fields.bloodType"),
        dataIndex: "bloodType",
        width: 110,
        defaultHidden: true,
        render: (value) =>
          value ? (
            bloodTypeLabel(value as BloodType)
          ) : (
            <span className={styles.muted}>—</span>
          ),
      },
      {
        key: "email",
        title: t("patients.fields.email"),
        dataIndex: "email",
        width: 220,
        defaultHidden: true,
        render: (value) =>
          value ? String(value) : <span className={styles.muted}>—</span>,
      },
      {
        key: "status",
        title: t("patients.columns.status"),
        dataIndex: "isActive",
        width: 120,
        render: (value) => <PatientStatusTag isActive={Boolean(value)} />,
      },
      {
        key: "createdAt",
        title: t("patients.columns.registered"),
        dataIndex: "createdAt",
        width: 140,
        defaultHidden: true,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) => formatDate(String(value)),
      },
    ],
    [t],
  );

  const register = canCreate && (
    <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreateOpen(true)}>
      {t("patients.registerButton")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("patients.title")}
        subtitle={t("patients.subtitle")}
        actions={register}
      />
      <DataTable<Patient>
        tableKey="patients"
        columns={columns}
        data={patients.data?.items}
        rowKey="id"
        loading={patients.isFetching}
        error={patients.error}
        onRetry={() => void patients.refetch()}
        sort={sort}
        onSortChange={(value) =>
          update({ sort: value ? `${value.key}:${value.order}` : undefined })
        }
        pagination={{
          page,
          pageSize,
          total: patients.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) =>
            update(
              {
                page: nextSize === pageSize && nextPage > 1 ? nextPage : undefined,
                size: nextSize === 20 ? undefined : nextSize,
              },
              true,
            ),
        }}
        rowLabel={(p) => `${fullName(p)} ${p.mrn}`}
        rowActions={(p) => {
          const edits: DataTableRowAction[] =
            canUpdate && p.isActive
              ? [
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: t("patients.edit"),
                    onClick: () => setEditId(p.id),
                  },
                ]
              : [];
          if (!canDeactivate) return edits;
          const statusAction: DataTableRowAction = p.isActive
            ? {
                key: "deactivate",
                icon: <StopOutlined />,
                label: t("patients.deactivate"),
                danger: true,
                onClick: () => deactivate(p),
              }
            : {
                key: "reactivate",
                icon: <UndoOutlined />,
                label: t("patients.reactivate"),
                onClick: () => reactivate(p),
              };
          return edits.length > 0 ? [...edits, "divider", statusAction] : [statusAction];
        }}
        rowAccent={(p) => (p.isActive ? undefined : "var(--color-muted)")}
        empty={
          filtersActive
            ? {
                title: t("patients.noMatchTitle"),
                description: t(
                  canCreate ? "patients.noMatchRegisterText" : "patients.noMatchText",
                ),
                action: (
                  <Flex gap="small" wrap justify="center">
                    <Button onClick={resetFilters}>{t("common.clearFilters")}</Button>
                    {register}
                  </Flex>
                ),
              }
            : {
                title: t("patients.emptyTitle"),
                description: t(
                  canCreate ? "patients.emptyText" : "patients.emptyReadText",
                ),
                action: register,
              }
        }
        toolbar={
          <>
            <SearchInput
              placeholder={t("patients.search")}
              value={search}
              onChange={(value) => update({ q: value })}
              className={styles.search}
            />
            <Select<Gender>
              allowClear
              placeholder={t("patients.allGenders")}
              value={gender}
              onChange={(value) => update({ gender: value })}
              options={Object.values(Gender).map((g) => ({
                value: g,
                label: t(`patients.gender.${g}`),
              }))}
              className={styles.filter}
              aria-label={t("patients.fields.gender")}
            />
            <Select<StatusFilter>
              value={status}
              onChange={(value) =>
                update({ status: value === "active" ? undefined : value })
              }
              options={STATUS_FILTERS.map((s) => ({
                value: s,
                label: t(`patients.statusFilter.${s}`),
              }))}
              className={styles.filter}
              aria-label={t("patients.columns.status")}
            />
            <ClearFiltersButton active={filtersActive} onClear={resetFilters} />
          </>
        }
      />
      <PatientModal
        open={createOpen || Boolean(editId)}
        patient={findPatient(editId)}
        onClose={() => {
          setCreateOpen(false);
          setEditId(null);
        }}
      />
    </>
  );
}
