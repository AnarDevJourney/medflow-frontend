import { SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Segmented, Select, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@components/data-table";
import { StatusBadge } from "@components/ui/StatusBadge";
import { AppointmentStatus } from "@models/enums";
import { STATUS_COLOR } from "@utils/statusColors";
import { MOCK_PATIENTS, type MockPatient } from "../utils/mockPatients";
import styles from "./TableDemoPage.module.css";

type Mode = "normal" | "loading" | "error" | "empty";

const money = new Intl.NumberFormat("az-AZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Dev-only playground of DataTable (route /dev/table, not in production
// builds): mock patients, client-side search / sort / paging, and buttons
// that force the loading, error and empty states.
export function TableDemoPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("normal");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columns = useMemo<DataTableColumn<MockPatient>[]>(
    () => [
      {
        key: "mrn",
        title: t("dev.table.col.mrn"),
        dataIndex: "mrn",
        width: 140,
        numeric: true,
        align: "left",
        defaultPinned: "left",
        sortable: true,
      },
      {
        key: "name",
        title: t("dev.table.col.name"),
        width: 240,
        hideable: false,
        sortable: true,
        render: (_, p) => (
          <span className={styles.patient}>
            <Avatar size={24} className={styles.avatar}>
              {p.firstName[0]}
              {p.lastName[0]}
            </Avatar>
            <span className={styles.patientName}>
              {p.firstName} {p.lastName}
            </span>
          </span>
        ),
      },
      {
        key: "age",
        title: t("dev.table.col.age"),
        dataIndex: "age",
        width: 90,
        numeric: true,
        sortable: true,
      },
      {
        key: "sex",
        title: t("dev.table.col.sex"),
        dataIndex: "sex",
        width: 110,
        render: (value) => t(`dev.table.sex.${String(value)}`),
      },
      {
        key: "phone",
        title: t("dev.table.col.phone"),
        dataIndex: "phone",
        width: 170,
        numeric: true,
        align: "left",
      },
      {
        key: "department",
        title: t("dev.table.col.department"),
        dataIndex: "department",
        width: 160,
        sortable: true,
      },
      {
        key: "doctor",
        title: t("dev.table.col.doctor"),
        dataIndex: "doctor",
        width: 200,
      },
      {
        key: "status",
        title: t("dev.table.col.status"),
        dataIndex: "status",
        width: 170,
        render: (value) => <StatusBadge status={value as AppointmentStatus} />,
      },
      {
        key: "lastVisit",
        title: t("dev.table.col.lastVisit"),
        dataIndex: "lastVisit",
        width: 140,
        numeric: true,
        sortable: true,
        render: (value) => dayjs(String(value)).format("DD.MM.YYYY"),
      },
      {
        key: "balance",
        title: t("dev.table.col.balance"),
        dataIndex: "balance",
        width: 130,
        numeric: true,
        sortable: true,
        render: (value) => `${money.format(Number(value))} ₼`,
      },
      {
        key: "insurance",
        title: t("dev.table.col.insurance"),
        dataIndex: "insurance",
        width: 160,
        numeric: true,
        align: "left",
        defaultHidden: true,
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const rows = MOCK_PATIENTS.filter(
      (p) =>
        (!status || p.status === status) &&
        (!q ||
          `${p.firstName} ${p.lastName}`.toLocaleLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q)),
    );
    if (!sort) return rows;
    const value = (p: MockPatient) =>
      sort.key === "name"
        ? `${p.lastName} ${p.firstName}`
        : p[sort.key as keyof MockPatient];
    return [...rows].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const cmp =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "az");
      return sort.order === "asc" ? cmp : -cmp;
    });
  }, [search, status, sort]);

  const data =
    mode === "empty" ? [] : filtered.slice((page - 1) * pageSize, page * pageSize);
  const filtersActive = Boolean(search || status);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Typography.Title level={3} className={styles.title}>
            {t("dev.table.title")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("dev.table.subtitle")}</Typography.Text>
        </div>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "normal", label: t("dev.table.normal") },
            { value: "loading", label: t("dev.table.simulateLoading") },
            { value: "error", label: t("dev.table.simulateError") },
            { value: "empty", label: t("dev.table.simulateEmpty") },
          ]}
        />
      </header>

      <DataTable<MockPatient>
        tableKey="dev-patients"
        columns={columns}
        data={mode === "loading" || mode === "error" ? undefined : data}
        rowKey="id"
        loading={mode === "loading"}
        error={mode === "error" ? new Error(t("dev.table.errorMessage")) : null}
        onRetry={() => setMode("normal")}
        empty={{
          title: t("dev.table.emptyTitle"),
          description: t("dev.table.emptyText"),
          action: filtersActive ? (
            <Button
              onClick={() => {
                setSearch("");
                setStatus(undefined);
              }}
            >
              {t("dev.table.clearFilters")}
            </Button>
          ) : undefined,
        }}
        sort={sort}
        onSortChange={setSort}
        pagination={{
          page,
          pageSize,
          total: mode === "empty" ? 0 : filtered.length,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
        rowAccent={(p) => STATUS_COLOR[p.status]}
        onRowClick={() => undefined}
        toolbar={
          <>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t("dev.table.search")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className={styles.search}
            />
            <Select<AppointmentStatus>
              allowClear
              placeholder={t("dev.table.allStatuses")}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={Object.values(AppointmentStatus).map((s) => ({
                value: s,
                label: t(`appointmentStatus.${s}`),
              }))}
              className={styles.status}
            />
          </>
        }
      />
    </div>
  );
}
