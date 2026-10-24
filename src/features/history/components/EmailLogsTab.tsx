import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button, Select, Tooltip } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@components/data-table";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { DateRangeFilter } from "@components/ui/DateRangeFilter";
import { SearchInput } from "@components/ui/SearchInput";
import { formatDateTime } from "@lib/dayjs";
import { EMAIL_STATUS_COLOR } from "@utils/statusColors";
import {
  EMAIL_TEMPLATES,
  listEmailLogs,
  type EmailLog,
  type EmailStatus,
} from "../services/historyService";
import { rangeToIso, type DayRange } from "@utils/dayRange";
import { EmailLogDrawer } from "./EmailLogDrawer";
import { EmailStatusTag } from "./EmailStatusTag";
import styles from "./History.module.css";

const STATUSES: EmailStatus[] = ["QUEUED", "SENT", "FAILED"];

// Every email the system sent or tried to send, with the delivery status
export function EmailLogsTab() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const templateLabel = useCallback(
    (template: string) =>
      t(`history.emailTemplates.${template}`, { defaultValue: template }),
    [t],
  );
  const [range, setRange] = useState<DayRange>(null);
  const [status, setStatus] = useState<EmailStatus>();
  const [template, setTemplate] = useState<string>();
  const [recipient, setRecipient] = useState("");
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const query = {
    page,
    limit: pageSize,
    status,
    template,
    recipient: recipient || undefined,
    ...rangeToIso(range),
    sort: sort ? `${sort.key}:${sort.order}` : undefined,
  };
  const logs = useQuery({
    queryKey: ["email-logs", query],
    queryFn: () => listEmailLogs(query),
    placeholderData: keepPreviousData,
  });
  const filtersActive = Boolean(range || status || template || recipient);

  const columns = useMemo<DataTableColumn<EmailLog>[]>(
    () => [
      {
        key: "createdAt",
        title: t("history.columns.createdAt"),
        dataIndex: "createdAt",
        width: 170,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) => formatDateTime(String(value)),
      },
      {
        key: "recipientEmail",
        title: t("history.columns.recipient"),
        dataIndex: "recipientEmail",
        width: 240,
        hideable: false,
      },
      {
        key: "template",
        title: t("history.columns.template"),
        dataIndex: "template",
        width: 170,
        render: (value) => templateLabel(String(value)),
      },
      {
        key: "subject",
        title: t("history.columns.subject"),
        dataIndex: "subject",
        width: 300,
      },
      {
        key: "status",
        title: t("staff.columns.status"),
        dataIndex: "status",
        width: 150,
        render: (value) => <EmailStatusTag status={value as EmailStatus} />,
      },
      {
        key: "attempts",
        title: t("history.columns.attempts"),
        dataIndex: "attempts",
        width: 100,
        numeric: true,
      },
      {
        key: "sentAt",
        title: t("history.columns.sentAt"),
        dataIndex: "sentAt",
        width: 170,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) =>
          value ? formatDateTime(String(value)) : <span className={styles.muted}>—</span>,
      },
      {
        key: "error",
        title: t("history.columns.error"),
        dataIndex: "error",
        width: 260,
        render: (value) =>
          value ? (
            <Tooltip title={String(value)}>
              <span className={styles.errorText}>{String(value)}</span>
            </Tooltip>
          ) : (
            <span className={styles.muted}>—</span>
          ),
      },
    ],
    [t, templateLabel],
  );

  const clear = () => {
    setRange(null);
    setStatus(undefined);
    setTemplate(undefined);
    setRecipient("");
    setPage(1);
  };

  return (
    <>
      <DataTable<EmailLog>
        tableKey="email-logs"
        columns={columns}
        data={logs.data?.items}
        rowKey="id"
        loading={logs.isFetching}
        error={logs.error}
        onRetry={() => void logs.refetch()}
        sort={sort}
        onSortChange={setSort}
        pagination={{
          page,
          pageSize,
          total: logs.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        rowAccent={(log) => EMAIL_STATUS_COLOR[log.status]}
        onRowClick={setSelected}
        onViewDetails={setSelected}
        rowLabel={(log) => log.recipientEmail}
        empty={
          filtersActive
            ? {
                title: t("history.noMatchTitle"),
                description: t("history.noMatchText"),
                action: <Button onClick={clear}>{t("common.clearFilters")}</Button>,
              }
            : {
                title: t("history.emailsEmptyTitle"),
                description: t("history.emailsEmptyText"),
              }
        }
        toolbar={
          <>
            <SearchInput
              placeholder={t("history.searchRecipient")}
              value={recipient}
              onChange={(value) => {
                setRecipient(value);
                setPage(1);
              }}
              className={styles.search}
            />
            <DateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                setPage(1);
              }}
            />
            <Select<EmailStatus>
              allowClear
              placeholder={t("staff.allStatuses")}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={STATUSES.map((value) => ({
                value,
                label: t(`history.emailStatus.${value}`),
              }))}
              className={styles.filter}
              aria-label={t("staff.columns.status")}
            />
            <Select
              allowClear
              placeholder={t("history.allTemplates")}
              value={template}
              onChange={(value) => {
                setTemplate(value);
                setPage(1);
              }}
              options={EMAIL_TEMPLATES.map((value) => ({
                value,
                label: templateLabel(value),
              }))}
              className={styles.filter}
              aria-label={t("history.columns.template")}
            />
            <ClearFiltersButton active={filtersActive} onClear={clear} />
          </>
        }
      />
      <EmailLogDrawer log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
