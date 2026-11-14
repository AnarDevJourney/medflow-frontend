import { HistoryOutlined } from "@ant-design/icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@components/ui/EmptyState";
import dayjs, { CLINIC_TZ, formatDate, formatDateTime, toClinicTime } from "@lib/dayjs";
import { useHistoryText } from "../hooks/useHistoryText";
import {
  listPersonHistory,
  listUserActivity,
  type HistoryEntry,
} from "../services/historyService";
import { eventLook } from "./eventLook";
import { HistoryDrawer } from "./HistoryDrawer";
import styles from "./PersonTimeline.module.css";

type Mode = "about" | "activity";
const PAGE_SIZE = 20;

// One person's history as a timeline, grouped by day (newest first):
// what happened to them, or what they did. A row opens the history drawer.
export function PersonTimeline({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { summary, eventLabel } = useHistoryText();
  const [mode, setMode] = useState<Mode>("about");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const history = useInfiniteQuery({
    queryKey: ["history", "person", mode, userId],
    queryFn: ({ pageParam }) =>
      (mode === "about" ? listPersonHistory : listUserActivity)(userId, {
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page * last.meta.limit < last.meta.total ? last.meta.page + 1 : undefined,
  });
  const entries = history.data?.pages.flatMap((page) => page.items);
  const total = history.data?.pages[0]?.meta.total ?? 0;

  // "Today", "Yesterday", "12 Nov 2026" in clinic time
  const dayLabel = (iso: string) => {
    const day = toClinicTime(iso);
    const today = dayjs().tz(CLINIC_TZ);
    if (day.isSame(today, "day")) return t("staffDetail.history.today");
    if (day.isSame(today.subtract(1, "day"), "day"))
      return t("staffDetail.history.yesterday");
    return formatDate(iso);
  };
  const groups: { label: string; items: HistoryEntry[] }[] = [];
  for (const entry of entries ?? []) {
    const label = dayLabel(entry.occurredAt);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("staffDetail.history.title")}</h2>
          <p className={styles.subtitle}>
            {t(`staffDetail.history.${mode}Hint`)}
            {history.data && total > 0 && (
              <> · {t("staffDetail.history.count", { count: total })}</>
            )}
          </p>
        </div>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "about", label: t("staffDetail.history.about") },
            { value: "activity", label: t("staffDetail.history.activity") },
          ]}
        />
      </header>

      {history.isError ? (
        <EmptyState
          title={t("staffDetail.history.error")}
          action={
            <Button onClick={() => void history.refetch()}>{t("common.retry")}</Button>
          }
        />
      ) : !entries ? (
        <Skeleton active avatar title={false} paragraph={{ rows: 4 }} />
      ) : entries.length === 0 ? (
        <EmptyState
          compact
          icon={<HistoryOutlined />}
          title={t(`staffDetail.history.${mode}Empty`)}
        />
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <h3 className={styles.day}>{group.label}</h3>
              <ol className={styles.list}>
                {group.items.map((entry) => {
                  const look = eventLook(entry.eventType);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={styles.row}
                        onClick={() => setSelected(entry)}
                      >
                        <span
                          className={`${styles.icon} ${styles[look.tone]}`}
                          aria-hidden="true"
                        >
                          {look.icon}
                        </span>
                        <span className={styles.text}>
                          <span className={styles.summary}>{summary(entry)}</span>
                          <span className={styles.meta}>
                            {eventLabel(entry.eventType)} ·{" "}
                            <Tooltip title={formatDateTime(entry.occurredAt)}>
                              <span>
                                {toClinicTime(entry.occurredAt).format("HH:mm")}
                              </span>
                            </Tooltip>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          {history.hasNextPage && (
            <div className={styles.more}>
              <Button
                loading={history.isFetchingNextPage}
                onClick={() => void history.fetchNextPage()}
              >
                {t("staffDetail.history.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      <HistoryDrawer entry={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
