import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, Skeleton } from "antd";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@components/ui/EmptyState";
import { PageHeader } from "@components/ui/PageHeader";
import { StatusBadge } from "@components/ui/StatusBadge";
import { UserAvatar } from "@components/ui/UserAvatar";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { toClinicTime } from "@lib/dayjs";
import { AppointmentStatus } from "@models/enums";
import { patientPath } from "@router/paths";
import { STATUS_COLOR } from "@utils/statusColors";
import { AppointmentDrawer } from "../components/AppointmentDrawer";
import { CancelAppointmentModal } from "../components/CancelAppointmentModal";
import { EditAppointmentModal } from "../components/EditAppointmentModal";
import { RescheduleModal } from "../components/RescheduleModal";
import { useAppointmentActions, useTodayAppointments } from "../hooks/useAppointments";
import type { Appointment } from "../services/appointmentsService";
import { timeRange } from "../utils/appointment";
import styles from "./TodayPage.module.css";

// Waiting this long or more is shown as overdue
const LONG_WAIT_MINUTES = 15;

// Re-renders every 30 s: waiting times and the "next" card stay current
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

const nameParts = (full: string) => {
  const [first = "", ...rest] = full.split(" ");
  return { firstName: first, lastName: rest.join(" ") };
};

// The doctor's day (DOC 9.1 "My day"): who is waiting now, who is next and
// the whole day in time order. Check-ins arrive live (socket refresh).
// "Start visit" comes with the encounters (phase 8).
export function TodayPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const today = useTodayAppointments({});
  const now = useNow();
  const [openRow, setOpenRow] = useState<Appointment | null>(null);
  const [moveRow, setMoveRow] = useState<Appointment | null>(null);
  const [editRow, setEditRow] = useState<Appointment | null>(null);
  const [cancelRow, setCancelRow] = useState<Appointment | null>(null);
  const { message } = App.useApp();
  const { checkIn } = useAppointmentActions();
  const items = useMemo(() => today.data ?? [], [today.data]);
  const opened = openRow ? (items.find((a) => a.id === openRow.id) ?? openRow) : null;

  const count = (status: AppointmentStatus) =>
    items.filter((a) => a.status === status).length;
  const waiting = items
    .filter((a) => a.status === AppointmentStatus.CHECKED_IN)
    .sort((x, y) => (x.checkedInAt ?? "").localeCompare(y.checkedInAt ?? ""));
  const next = items.find(
    (a) => a.status === AppointmentStatus.SCHEDULED && Date.parse(a.endsAt) > now,
  );
  const active = items.filter((a) => a.status !== AppointmentStatus.CANCELLED);
  const nowIndex = items.findIndex((a) => Date.parse(a.startsAt) > now);

  const summary = [
    { key: "total", value: active.length, label: t("today.summary.total") },
    {
      key: "waiting",
      value: waiting.length,
      label: t("today.summary.waiting"),
      color: STATUS_COLOR.CHECKED_IN,
    },
    {
      key: "done",
      value: count(AppointmentStatus.COMPLETED),
      label: t("today.summary.done"),
      color: STATUS_COLOR.COMPLETED,
    },
    {
      key: "noShow",
      value: count(AppointmentStatus.NO_SHOW),
      label: t("today.summary.noShow"),
      color: STATUS_COLOR.NO_SHOW,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("today.title")}
        subtitle={toClinicTime(new Date(now)).format("dddd, D MMMM YYYY")}
      />
      {today.error ? (
        <Alert
          type="error"
          showIcon
          title={errorMessage(today.error)}
          action={
            <Button size="small" onClick={() => void today.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : !today.data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CoffeeOutlined />}
          title={t("today.emptyTitle")}
          description={t("today.emptyText")}
        />
      ) : (
        <div className={styles.page}>
          <div className={styles.summary}>
            {summary.map((item) => (
              <div
                key={item.key}
                className={styles.summaryItem}
                style={
                  item.color ? ({ "--tone": item.color } as CSSProperties) : undefined
                }
                data-toned={item.color ? true : undefined}
              >
                <span className={styles.summaryValue}>{item.value}</span>
                <span className={styles.summaryLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.columns}>
            <div className={styles.side}>
              <section className={styles.card} aria-labelledby="today-waiting">
                <h2 id="today-waiting" className={styles.cardTitle}>
                  {t("today.waiting")}
                  {waiting.length > 0 && (
                    <span className={styles.badge}>{waiting.length}</span>
                  )}
                </h2>
                {waiting.length === 0 ? (
                  <p className={styles.quiet}>{t("today.nobodyWaiting")}</p>
                ) : (
                  <ul className={styles.waitList}>
                    {waiting.map((a) => {
                      const minutes = Math.max(
                        0,
                        Math.floor(
                          (now - Date.parse(a.checkedInAt ?? a.startsAt)) / 60_000,
                        ),
                      );
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            className={styles.waitRow}
                            onClick={() => setOpenRow(a)}
                          >
                            <UserAvatar {...nameParts(a.patientName)} size={36} />
                            <span className={styles.waitText}>
                              <span className={styles.waitName}>{a.patientName}</span>
                              <span className={styles.muted}>
                                {timeRange(a.startsAt, a.endsAt)} ·{" "}
                                {t(`appointments.types.${a.type}`)}
                              </span>
                            </span>
                            <span
                              className={styles.waitTime}
                              data-long={minutes >= LONG_WAIT_MINUTES || undefined}
                            >
                              <ClockCircleOutlined aria-hidden="true" />
                              {t("today.waitingFor", { count: minutes })}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className={styles.card} aria-labelledby="today-next">
                <h2 id="today-next" className={styles.cardTitle}>
                  {t("today.next")}
                </h2>
                {next ? (
                  <div className={styles.next}>
                    <span className={styles.nextTime}>
                      {toClinicTime(next.startsAt).format("HH:mm")}
                    </span>
                    <span className={styles.nextName}>{next.patientName}</span>
                    <span className={styles.muted}>
                      {next.patientMrn} · {t(`appointments.types.${next.type}`)}
                    </span>
                    {next.reason && <p className={styles.reason}>{next.reason}</p>}
                    <Link to={patientPath(next.patientId)} className={styles.link}>
                      <UserOutlined aria-hidden="true" /> {t("today.openProfile")}{" "}
                      <ArrowRightOutlined aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <p className={styles.quiet}>{t("today.noNext")}</p>
                )}
              </section>
            </div>

            <section className={styles.card} aria-labelledby="today-day">
              <h2 id="today-day" className={styles.cardTitle}>
                {t("today.schedule")}
              </h2>
              <ol className={styles.timeline}>
                {items.map((a, index) => {
                  const past = Date.parse(a.endsAt) <= now;
                  return (
                    <li key={a.id}>
                      {index === nowIndex && (
                        <span className={styles.nowMarker}>
                          {t("today.now", {
                            time: toClinicTime(new Date(now)).format("HH:mm"),
                          })}
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.row}
                        style={{ "--status": STATUS_COLOR[a.status] } as CSSProperties}
                        data-past={past || undefined}
                        data-status={a.status}
                        onClick={() => setOpenRow(a)}
                      >
                        <span className={styles.rowTime}>
                          {timeRange(a.startsAt, a.endsAt)}
                        </span>
                        <span className={styles.rowMain}>
                          <span className={styles.rowName}>{a.patientName}</span>
                          <span className={styles.muted}>
                            {a.patientMrn} · {t(`appointments.types.${a.type}`)}
                            {a.reason ? ` · ${a.reason}` : ""}
                          </span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  );
                })}
                {nowIndex === -1 && (
                  <li>
                    <span className={styles.nowMarker}>{t("today.dayOver")}</span>
                  </li>
                )}
              </ol>
            </section>
          </div>
        </div>
      )}
      <AppointmentDrawer
        appointment={opened}
        onClose={() => setOpenRow(null)}
        commands={{
          // shown only if the role was given appointments.check_in
          onCheckIn: (a) =>
            checkIn.mutate(a.id, {
              onSuccess: (done) =>
                void message.success(
                  t("appointments.checkIn.done", { name: done.patientName }),
                ),
              onError: (error) => void message.error(errorMessage(error)),
            }),
          checkingIn: checkIn.isPending,
          onReschedule: setMoveRow,
          onEdit: setEditRow,
          onCancel: setCancelRow,
        }}
      />
      <RescheduleModal appointment={moveRow} onClose={() => setMoveRow(null)} />
      <EditAppointmentModal appointment={editRow} onClose={() => setEditRow(null)} />
      <CancelAppointmentModal
        appointment={cancelRow}
        onClose={() => setCancelRow(null)}
      />
    </>
  );
}
