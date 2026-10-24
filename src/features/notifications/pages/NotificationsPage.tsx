import { CheckOutlined } from "@ant-design/icons";
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
import { PageHeader } from "@components/ui/PageHeader";
import { formatDateTime, fromNow } from "@lib/dayjs";
import { useAppSelector } from "@store/index";
import { rangeToIso, type DayRange } from "@utils/dayRange";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { NotificationIcon } from "../components/NotificationIcon";
import { PriorityTag, ReadStatusTag } from "../components/NotificationTags";
import {
  useMarkRead,
  useNotificationsList,
  useNotificationText,
} from "../hooks/useNotifications";
import {
  NOTIFICATION_TYPES,
  type NotificationItem,
} from "../services/notificationsService";
import styles from "./NotificationsPage.module.css";

type ReadFilter = "unread" | "read";
type PriorityFilter = "urgent" | "normal";

// Unread urgent → warning, unread → primary, read → quiet
const accentOf = (n: NotificationItem) =>
  n.isRead
    ? "var(--color-muted)"
    : n.isUrgent
      ? "var(--color-warning)"
      : "var(--color-primary)";

// All own notifications in the app's DataTable: filters, row menu
// (view details / mark as read) and a detail drawer
export function NotificationsPage() {
  const { t } = useTranslation();
  const text = useNotificationText();
  const unreadCount = useAppSelector((state) => state.ui.unreadCount) ?? 0;
  const [readFilter, setReadFilter] = useState<ReadFilter>();
  const [priority, setPriority] = useState<PriorityFilter>();
  const [type, setType] = useState<string>();
  const [range, setRange] = useState<DayRange>(null);
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useNotificationsList({
    page,
    limit: pageSize,
    unread: readFilter ? readFilter === "unread" : undefined,
    urgent: priority ? priority === "urgent" : undefined,
    type,
    ...rangeToIso(range),
    sort: sort ? `createdAt:${sort.order}` : undefined,
  });
  const { read, readAll } = useMarkRead();
  const { mutate: markRead } = read;
  // Always the fresh row (the list refetches after every change)
  const selected = list.data?.items.find((n) => n.id === selectedId) ?? null;
  const filtersActive = Boolean(readFilter || priority || type || range);

  const typeLabel = useCallback(
    (value: string) => t(`notificationTypes.${value}.label`, { defaultValue: value }),
    [t],
  );

  // Opening a notification counts as reading it
  const open = useCallback(
    (n: NotificationItem) => {
      setSelectedId(n.id);
      if (!n.isRead) markRead(n.id);
    },
    [markRead],
  );

  const columns = useMemo<DataTableColumn<NotificationItem>[]>(
    () => [
      {
        key: "notification",
        title: t("notifications.columns.notification"),
        width: 460,
        hideable: false,
        render: (_, n) => {
          const { title, message } = text(n);
          return (
            <div className={styles.cell}>
              <NotificationIcon type={n.type} urgent={n.isUrgent} />
              <div className={styles.cellText}>
                <span className={n.isRead ? styles.title : styles.titleUnread}>
                  {title}
                </span>
                <span className={styles.message}>{message}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "type",
        title: t("notifications.columns.type"),
        dataIndex: "type",
        width: 180,
        render: (value) => typeLabel(String(value)),
      },
      {
        key: "priority",
        title: t("notifications.columns.priority"),
        width: 140,
        render: (_, n) => <PriorityTag urgent={n.isUrgent} />,
      },
      {
        key: "status",
        title: t("notifications.columns.status"),
        width: 150,
        render: (_, n) => <ReadStatusTag read={n.isRead} />,
      },
      {
        key: "createdAt",
        title: t("notifications.columns.createdAt"),
        dataIndex: "createdAt",
        width: 180,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) => (
          <Tooltip title={fromNow(String(value))}>
            <span>{formatDateTime(String(value))}</span>
          </Tooltip>
        ),
      },
      {
        key: "readAt",
        title: t("notifications.columns.readAt"),
        dataIndex: "readAt",
        width: 180,
        numeric: true,
        align: "left",
        defaultHidden: true,
        render: (value) =>
          value ? formatDateTime(String(value)) : <span className={styles.muted}>—</span>,
      },
    ],
    [t, text, typeLabel],
  );

  const resetPage = () => setPage(1);
  const clear = () => {
    setReadFilter(undefined);
    setPriority(undefined);
    setType(undefined);
    setRange(null);
    resetPage();
  };

  return (
    <>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle", { count: unreadCount })}
        actions={
          <Button
            icon={<CheckOutlined />}
            disabled={unreadCount === 0}
            loading={readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            {t("notifications.markAllRead")}
          </Button>
        }
      />
      <DataTable<NotificationItem>
        tableKey="notifications"
        columns={columns}
        data={list.data?.items}
        rowKey="id"
        loading={list.isFetching}
        error={list.error}
        onRetry={() => void list.refetch()}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          resetPage();
        }}
        pagination={{
          page,
          pageSize,
          total: list.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        rowAccent={accentOf}
        onRowClick={open}
        onViewDetails={open}
        rowLabel={(n) => text(n).title}
        rowActions={(n) => [
          {
            key: "read",
            icon: <CheckOutlined />,
            label: t("notifications.markRead"),
            disabled: n.isRead,
            onClick: () => markRead(n.id),
          },
        ]}
        empty={
          filtersActive
            ? {
                title: t("notifications.noMatchTitle"),
                description: t("notifications.noMatchText"),
                action: <Button onClick={clear}>{t("common.clearFilters")}</Button>,
              }
            : {
                title: t("notifications.emptyTitle"),
                description: t("notifications.emptyText"),
              }
        }
        toolbar={
          <>
            <Select<ReadFilter>
              allowClear
              placeholder={t("notifications.allStatuses")}
              value={readFilter}
              onChange={(value) => {
                setReadFilter(value);
                resetPage();
              }}
              options={[
                { value: "unread", label: t("notifications.unread") },
                { value: "read", label: t("notifications.read") },
              ]}
              className={styles.filter}
              aria-label={t("notifications.columns.status")}
            />
            <Select<PriorityFilter>
              allowClear
              placeholder={t("notifications.allPriorities")}
              value={priority}
              onChange={(value) => {
                setPriority(value);
                resetPage();
              }}
              options={[
                { value: "urgent", label: t("notifications.urgent") },
                { value: "normal", label: t("notifications.normal") },
              ]}
              className={styles.filter}
              aria-label={t("notifications.columns.priority")}
            />
            <Select
              allowClear
              placeholder={t("notifications.allTypes")}
              value={type}
              onChange={(value) => {
                setType(value);
                resetPage();
              }}
              options={NOTIFICATION_TYPES.map((value) => ({
                value,
                label: typeLabel(value),
              }))}
              className={styles.filter}
              aria-label={t("notifications.columns.type")}
            />
            <DateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                resetPage();
              }}
            />
            <ClearFiltersButton active={filtersActive} onClear={clear} />
          </>
        }
      />
      <NotificationDrawer notification={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
