import { CalendarOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Segmented, Skeleton, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@components/ui/EmptyState";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useTimeOff, useTimeOffActions } from "../hooks/useTimeOff";
import type { TimeOff } from "../services/timeOffService";
import { formatPeriod, isCurrent } from "../utils/timeOff";
import { TimeOffModal } from "./TimeOffModal";
import { TimeOffTypeTag } from "./TimeOffTypeTag";
import styles from "./TimeOff.module.css";

type Scope = "upcoming" | "past";

// A doctor's leave periods on the schedule page. Upcoming = not ended yet
// (soonest first); past = ended (latest first) and kept as history.
export function TimeOffCard({
  userId,
  doctorName,
  editable,
}: {
  userId: string;
  doctorName: string;
  editable: boolean;
}) {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const errorMessage = useErrorMessage();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [adding, setAdding] = useState(false);
  const list = useTimeOff({
    userId,
    scope,
    sort: scope === "upcoming" ? "startDate:asc" : "startDate:desc",
    limit: 100,
  });
  const { remove } = useTimeOffActions();
  const items = list.data?.items;

  const confirmRemove = (item: TimeOff) =>
    modal.confirm({
      title: t("timeOff.removeTitle"),
      content: t("timeOff.removeText", {
        type: t(`timeOff.types.${item.type}`),
        period: formatPeriod(item.startDate, item.endDate),
      }),
      okText: t("timeOff.remove"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () =>
        remove.mutateAsync(item.id).then(
          () => void message.success(t("timeOff.removed")),
          (error: unknown) => void message.error(errorMessage(error)),
        ),
    });

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("timeOff.title")}</h2>
          <p className={styles.subtitle}>{t("timeOff.subtitle")}</p>
        </div>
        <div className={styles.headerActions}>
          <Segmented<Scope>
            value={scope}
            onChange={setScope}
            options={[
              { value: "upcoming", label: t("timeOff.upcoming") },
              { value: "past", label: t("timeOff.past") },
            ]}
          />
          {editable && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdding(true)}
            >
              {t("timeOff.addButton")}
            </Button>
          )}
        </div>
      </header>

      {list.isError ? (
        <EmptyState
          title={t("timeOff.errorTitle")}
          action={
            <Button onClick={() => void list.refetch()}>{t("common.retry")}</Button>
          }
        />
      ) : !items ? (
        <Skeleton active title={false} paragraph={{ rows: 3 }} />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarOutlined />}
          title={t(scope === "upcoming" ? "timeOff.emptyUpcoming" : "timeOff.emptyPast")}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.row}>
              <TimeOffTypeTag type={item.type} />
              <div className={styles.main}>
                <div className={styles.period}>
                  {formatPeriod(item.startDate, item.endDate)}
                  <span className={styles.days}>
                    {t("timeOff.daysCount", { count: item.days })}
                  </span>
                  {isCurrent(item) && (
                    <span className={styles.now}>{t("timeOff.now")}</span>
                  )}
                </div>
                <div className={styles.meta}>
                  {[
                    item.reason,
                    item.createdByName &&
                      t("timeOff.addedBy", { name: item.createdByName }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              {editable && scope === "upcoming" && (
                <Tooltip title={t("timeOff.remove")}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={t("timeOff.remove")}
                    onClick={() => confirmRemove(item)}
                  />
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <TimeOffModal
          open={adding}
          userId={userId}
          doctorName={doctorName}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}
