import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button, Select, Tooltip } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { DateRangeFilter } from "@components/ui/DateRangeFilter";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@components/data-table";
import { RoleTag } from "@components/ui/RoleTag";
import { formatDateTime, fromNow } from "@lib/dayjs";
import type { Role } from "@models/enums";
import {
  ENTITY_TYPES,
  EVENT_TYPES,
  listHistory,
  type HistoryEntry,
} from "../services/historyService";
import { rangeToIso, type DayRange } from "@utils/dayRange";
import { useHistoryText } from "../hooks/useHistoryText";
import { EventTypeTag } from "./EventTypeTag";
import { HistoryDrawer } from "./HistoryDrawer";
import styles from "./History.module.css";

// Global audit feed: who did what, when (newest first)
export function ActionHistoryTab() {
  const { t } = useTranslation();
  const { eventLabel, summary } = useHistoryText();
  const [range, setRange] = useState<DayRange>(null);
  const [eventType, setEventType] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const query = {
    page,
    limit: pageSize,
    eventType,
    entityType,
    ...rangeToIso(range),
    sort: sort ? `occurredAt:${sort.order}` : undefined,
  };
  const history = useQuery({
    queryKey: ["history", query],
    queryFn: () => listHistory(query),
    placeholderData: keepPreviousData,
  });
  const filtersActive = Boolean(range || eventType || entityType);

  const columns = useMemo<DataTableColumn<HistoryEntry>[]>(
    () => [
      {
        key: "occurredAt",
        title: t("history.columns.occurredAt"),
        dataIndex: "occurredAt",
        width: 170,
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
        key: "actor",
        title: t("history.columns.actor"),
        width: 210,
        render: (_, e) =>
          e.actor ? (
            <span className={styles.actor}>
              <span className={styles.actorName}>{e.actor.name}</span>
              <span className={styles.actorRole}>
                {t(`roles.${e.actor.role}`, { defaultValue: e.actor.role })}
              </span>
            </span>
          ) : (
            <span className={styles.muted}>{t("history.system")}</span>
          ),
      },
      {
        key: "eventType",
        title: t("history.columns.eventType"),
        dataIndex: "eventType",
        width: 200,
        render: (value) => <EventTypeTag value={String(value)} />,
      },
      {
        key: "summary",
        title: t("history.columns.summary"),
        dataIndex: "summary",
        width: 420,
        hideable: false,
        render: (_, e) => summary(e),
      },
      {
        key: "entityType",
        title: t("history.columns.entity"),
        dataIndex: "entityType",
        width: 130,
        render: (value) =>
          t(`history.entities.${String(value)}`, { defaultValue: String(value) }),
      },
      {
        key: "source",
        title: t("history.columns.source"),
        dataIndex: "source",
        width: 180,
        defaultHidden: true,
        render: (value) =>
          t(`history.sources.${String(value)}`, { defaultValue: String(value) }),
      },
      {
        key: "actorRole",
        title: t("history.columns.actorRole"),
        width: 160,
        defaultHidden: true,
        render: (_, e) => (e.actor ? <RoleTag role={e.actor.role as Role} /> : "—"),
      },
    ],
    [t, summary],
  );

  const clear = () => {
    setRange(null);
    setEventType(undefined);
    setEntityType(undefined);
    setPage(1);
  };

  return (
    <>
      <DataTable<HistoryEntry>
        tableKey="action-history"
        columns={columns}
        data={history.data?.items}
        rowKey="id"
        loading={history.isFetching}
        error={history.error}
        onRetry={() => void history.refetch()}
        sort={sort}
        onSortChange={setSort}
        pagination={{
          page,
          pageSize,
          total: history.data?.meta.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        onRowClick={setSelected}
        onViewDetails={setSelected}
        rowLabel={(e) => eventLabel(e.eventType)}
        empty={
          filtersActive
            ? {
                title: t("history.noMatchTitle"),
                description: t("history.noMatchText"),
                action: <Button onClick={clear}>{t("common.clearFilters")}</Button>,
              }
            : { title: t("history.emptyTitle"), description: t("history.emptyText") }
        }
        toolbar={
          <>
            <DateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                setPage(1);
              }}
            />
            <Select
              allowClear
              showSearch
              placeholder={t("history.allEvents")}
              value={eventType}
              onChange={(value) => {
                setEventType(value);
                setPage(1);
              }}
              options={EVENT_TYPES.map((value) => ({ value, label: eventLabel(value) }))}
              className={styles.filter}
              aria-label={t("history.columns.eventType")}
            />
            <Select
              allowClear
              placeholder={t("history.allEntities")}
              value={entityType}
              onChange={(value) => {
                setEntityType(value);
                setPage(1);
              }}
              options={ENTITY_TYPES.map((value) => ({
                value,
                label: t(`history.entities.${value}`, { defaultValue: value }),
              }))}
              className={styles.filter}
              aria-label={t("history.columns.entity")}
            />
            <ClearFiltersButton active={filtersActive} onClear={clear} />
          </>
        }
      />
      <HistoryDrawer entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}
