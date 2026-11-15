import { CalendarOutlined } from "@ant-design/icons";
import { Alert, App, Button, Skeleton } from "antd";
import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@components/ui/EmptyState";
import { StatusBadge } from "@components/ui/StatusBadge";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { CLINIC_TZ } from "@lib/dayjs";
import { STATUS_COLOR } from "@utils/statusColors";
import { useAppointmentActions, useAppointments } from "../hooks/useAppointments";
import type { Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CancelAppointmentModal } from "./CancelAppointmentModal";
import { EditAppointmentModal } from "./EditAppointmentModal";
import { RescheduleModal } from "./RescheduleModal";
import styles from "./PatientAppointmentsTab.module.css";

const DAY = "YYYY-MM-DD";

// One list of the tab: upcoming (from today, soonest first) or past (before
// today, newest first)
function AppointmentList({
  title,
  items,
  loading,
  error,
  onRetry,
  empty,
  onOpen,
}: {
  title: string;
  items: Appointment[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  empty: string;
  onOpen: (a: Appointment) => void;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>
        {title}
        {items && items.length > 0 && (
          <span className={styles.count}>{items.length}</span>
        )}
      </h3>
      {error ? (
        <Alert
          type="error"
          showIcon
          title={errorMessage(error)}
          action={
            <Button size="small" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : loading && !items ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : !items?.length ? (
        <p className={styles.quiet}>{empty}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={styles.row}
                style={{ "--status": STATUS_COLOR[a.status] } as CSSProperties}
                data-status={a.status}
                onClick={() => onOpen(a)}
              >
                <span className={styles.when}>
                  <span className={styles.time}>{timeRange(a.startsAt, a.endsAt)}</span>
                  <span className={styles.muted}>{dayLabel(a.startsAt)}</span>
                </span>
                <span className={styles.main}>
                  <span className={styles.doctor}>{a.doctorName}</span>
                  <span className={styles.muted}>
                    {a.departmentName} · {t(`appointments.types.${a.type}`)}
                  </span>
                </span>
                <StatusBadge status={a.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Patient profile → Appointments (DOC 9.1): what is coming and what
// happened, each opening the appointment drawer with its actions
export function PatientAppointmentsTab({
  patientId,
  onBook,
}: {
  patientId: string;
  onBook?: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const today = dayjs().tz(CLINIC_TZ);
  const upcoming = useAppointments({
    page: 1,
    limit: 50,
    patientId,
    from: today.format(DAY),
    sort: "startsAt:asc",
  });
  const past = useAppointments({
    page: 1,
    limit: 50,
    patientId,
    to: today.subtract(1, "day").format(DAY),
    sort: "startsAt:desc",
  });
  const [openRow, setOpenRow] = useState<Appointment | null>(null);
  const [moveRow, setMoveRow] = useState<Appointment | null>(null);
  const [editRow, setEditRow] = useState<Appointment | null>(null);
  const [cancelRow, setCancelRow] = useState<Appointment | null>(null);
  const { checkIn } = useAppointmentActions();
  const all = [...(upcoming.data?.items ?? []), ...(past.data?.items ?? [])];
  const opened = openRow ? (all.find((a) => a.id === openRow.id) ?? openRow) : null;
  const nothing = upcoming.data?.meta.total === 0 && past.data?.meta.total === 0;

  return (
    <div className={styles.tab}>
      {nothing ? (
        <EmptyState
          icon={<CalendarOutlined />}
          title={t("patientAppointments.emptyTitle")}
          description={t(
            onBook
              ? "patientAppointments.emptyText"
              : "patientAppointments.emptyReadText",
          )}
          action={
            onBook && (
              <Button type="primary" icon={<CalendarOutlined />} onClick={onBook}>
                {t("appointments.bookButton")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <AppointmentList
            title={t("patientAppointments.upcoming")}
            items={upcoming.data?.items}
            loading={upcoming.isFetching}
            error={upcoming.error}
            onRetry={() => void upcoming.refetch()}
            empty={t("patientAppointments.noUpcoming")}
            onOpen={setOpenRow}
          />
          <AppointmentList
            title={t("patientAppointments.past")}
            items={past.data?.items}
            loading={past.isFetching}
            error={past.error}
            onRetry={() => void past.refetch()}
            empty={t("patientAppointments.noPast")}
            onOpen={setOpenRow}
          />
        </>
      )}
      <AppointmentDrawer
        appointment={opened}
        onClose={() => setOpenRow(null)}
        commands={{
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
    </div>
  );
}
