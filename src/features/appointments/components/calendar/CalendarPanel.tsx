import {
  ArrowRightOutlined,
  FieldTimeOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, DatePicker, Select, Skeleton, Switch } from "antd";
import { useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { EmptyState } from "@components/ui/EmptyState";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { useDoctors } from "@features/staff/hooks/useStaff";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { toClinicTime } from "@lib/dayjs";
import { AppointmentStatus } from "@models/enums";
import { STATUS_COLOR } from "@utils/statusColors";
import { useAppointmentActions, useCalendar } from "../../hooks/useAppointments";
import { useAppointmentRules } from "../../hooks/useAppointmentRules";
import type { Appointment } from "../../services/appointmentsService";
import { dayLabel, timeRange } from "../../utils/appointment";
import { CalendarGrid, type SlotTarget } from "./CalendarGrid";
import { clinicToday, dayColumns, hhmm, instantOf, weekColumns, weekOf } from "./model";
import styles from "./Calendar.module.css";

export interface CalendarState {
  view: "day" | "week";
  date: string; // YYYY-MM-DD
  departmentId?: string;
  doctorId?: string;
  showCancelled: boolean;
}

interface Move {
  appointment: Appointment;
  target: SlotTarget;
}

// Day view (doctors side by side) and week view (one doctor, Monday to
// Sunday). Clicking a free slot books it, dragging a card moves it — after
// a confirmation, with the same server checks as "Reschedule".
export function CalendarPanel({
  state,
  onChange,
  onOpen,
  onBookSlot,
}: {
  state: CalendarState;
  onChange: (patch: Partial<CalendarState>) => void;
  onOpen: (appointment: Appointment) => void;
  onBookSlot?: (slot: {
    doctorId: string;
    departmentId: string | null;
    date: string;
    startsAt: string;
  }) => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const rulesOf = useAppointmentRules();
  const { reschedule } = useAppointmentActions();
  const [move, setMove] = useState<Move | null>(null);
  const doctors = useDoctors(state.departmentId);

  const dates = useMemo(
    () => (state.view === "week" ? weekOf(state.date) : [state.date]),
    [state.view, state.date],
  );
  const needsDoctor = state.view === "week" && !state.doctorId;
  const calendar = useCalendar(
    needsDoctor
      ? null
      : {
          from: dates[0],
          to: dates[dates.length - 1],
          departmentId: state.departmentId,
          doctorId: state.doctorId,
          includeCancelled: state.showCancelled || undefined,
        },
  );
  const columns = useMemo(() => {
    if (!calendar.data) return [];
    return state.view === "week" && state.doctorId
      ? weekColumns(calendar.data, state.doctorId, dates)
      : dayColumns(calendar.data, state.date);
  }, [calendar.data, state.view, state.doctorId, state.date, dates]);

  const step = state.view === "week" ? 7 : 1;
  const shift = (days: number) =>
    onChange({ date: dayjs(state.date).add(days, "day").format("YYYY-MM-DD") });
  const title =
    state.view === "week"
      ? `${dayjs(dates[0]).format("D MMM")} – ${dayjs(dates[6]).format("D MMM YYYY")}`
      : dayjs(state.date).format("dddd, D MMMM YYYY");
  const isCurrent =
    state.view === "week" ? dates.includes(clinicToday()) : state.date === clinicToday();

  const confirmMove = () => {
    if (!move) return;
    const { appointment, target } = move;
    reschedule.mutate(
      {
        id: appointment.id,
        input: {
          startsAt: instantOf(target.column.date, target.minutes),
          ...(target.column.doctorId !== appointment.doctorId
            ? { doctorId: target.column.doctorId }
            : {}),
        },
      },
      {
        onSuccess: (moved) => {
          void message.success(
            t("appointments.reschedule.done", {
              name: moved.patientName,
              time: toClinicTime(moved.startsAt).format("DD MMM, HH:mm"),
              doctor: moved.doctorName,
            }),
          );
          setMove(null);
        },
        onError: (error) => {
          const details = (isApiError(error) ? error.details : null) as {
            reason?: string;
            conflict?: string;
          } | null;
          void message.error(
            isApiError(error, "SLOT_TAKEN")
              ? t(
                  details?.conflict === "PATIENT"
                    ? "appointments.book.patientBusy"
                    : "appointments.book.slotTaken",
                )
              : details?.reason
                ? t(`appointments.rules.${details.reason}`, {
                    defaultValue: errorMessage(error),
                  })
                : errorMessage(error),
          );
          setMove(null);
          void calendar.refetch();
        },
      },
    );
  };

  return (
    <section aria-label={t("appointments.calendar.label")}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <Button
            icon={<LeftOutlined />}
            onClick={() => shift(-step)}
            aria-label={t("appointments.calendar.previous")}
          />
          <Button
            type={isCurrent ? "primary" : "default"}
            ghost={isCurrent}
            onClick={() => onChange({ date: clinicToday() })}
          >
            {t("appointments.today")}
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={() => shift(step)}
            aria-label={t("appointments.calendar.next")}
          />
        </div>
        <DatePicker
          value={dayjs(state.date)}
          allowClear={false}
          format="DD.MM.YYYY"
          picker={state.view === "week" ? "week" : "date"}
          onChange={(value) => value && onChange({ date: value.format("YYYY-MM-DD") })}
          aria-label={t("appointments.fields.date")}
        />
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.spacer} />
        <DepartmentSelect
          allowClear
          placeholder={t("appointments.allDepartments")}
          value={state.departmentId}
          onChange={(value) => onChange({ departmentId: value, doctorId: undefined })}
          className={styles.filter}
          aria-label={t("appointments.fields.department")}
        />
        <Select<string>
          allowClear={state.view === "day"}
          showSearch={{ optionFilterProp: "label" }}
          placeholder={
            state.view === "week"
              ? t("appointments.calendar.pickDoctor")
              : t("appointments.allDoctors")
          }
          value={state.doctorId}
          onChange={(value) => onChange({ doctorId: value })}
          loading={doctors.isLoading}
          options={(doctors.data ?? []).map((d) => ({
            value: d.userId,
            label: `${d.firstName} ${d.lastName}`,
          }))}
          className={styles.filter}
          status={needsDoctor ? "warning" : undefined}
          aria-label={t("appointments.fields.doctor")}
        />
        <label className={styles.cancelledToggle}>
          <Switch
            size="small"
            checked={state.showCancelled}
            onChange={(checked) => onChange({ showCancelled: checked })}
          />
          {t("appointments.calendar.showCancelled")}
        </label>
      </div>

      {needsDoctor ? (
        <EmptyState
          icon={<UserOutlined />}
          title={t("appointments.calendar.pickDoctorTitle")}
          description={t("appointments.calendar.pickDoctorText")}
        />
      ) : calendar.error ? (
        <Alert
          type="error"
          showIcon
          title={errorMessage(calendar.error)}
          action={
            <Button size="small" onClick={() => void calendar.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : !calendar.data ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : columns.length === 0 ? (
        <EmptyState
          title={t("appointments.calendar.emptyTitle")}
          description={t("appointments.calendar.emptyText")}
        />
      ) : (
        <CalendarGrid
          columns={columns}
          headerMode={state.view === "week" ? "day" : "doctor"}
          onOpen={onOpen}
          onSlotClick={
            onBookSlot
              ? ({ column, minutes }) =>
                  onBookSlot({
                    doctorId: column.doctorId,
                    departmentId: column.departmentId,
                    date: column.date,
                    startsAt: instantOf(column.date, minutes),
                  })
              : undefined
          }
          canDrag={(a) => rulesOf(a).reschedule && Date.parse(a.startsAt) > Date.now()}
          onMove={(appointment, target) => setMove({ appointment, target })}
        />
      )}

      <div className={styles.legend} aria-hidden="true">
        {[
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_PROGRESS,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.NO_SHOW,
        ].map((status) => (
          <span key={status} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ "--status": STATUS_COLOR[status] } as CSSProperties}
            />
            {t(`appointmentStatus.${status}`)}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendHatch} />
          {t("appointments.calendar.notWorking")}
        </span>
      </div>

      <AppModal
        open={Boolean(move)}
        onClose={() => setMove(null)}
        title={t("appointments.calendar.moveTitle")}
        description={move?.appointment.patientName}
        icon={<FieldTimeOutlined />}
        size="sm"
        primaryAction={{
          label: t("appointments.reschedule.submit"),
          loading: reschedule.isPending,
          onClick: confirmMove,
        }}
      >
        {move && (
          <div className={styles.moveSummary}>
            <div className={styles.moveFrom}>
              <span>
                {dayLabel(move.appointment.startsAt)},{" "}
                {timeRange(move.appointment.startsAt, move.appointment.endsAt)}
              </span>
              <span className={styles.moveDoctor}>{move.appointment.doctorName}</span>
            </div>
            <ArrowRightOutlined aria-hidden="true" className={styles.moveArrow} />
            <div className={styles.moveTo}>
              <span>
                {dayLabel(instantOf(move.target.column.date, move.target.minutes))},{" "}
                {hhmm(move.target.minutes)}
              </span>
              <span className={styles.moveDoctor}>{move.target.column.doctorName}</span>
            </div>
          </div>
        )}
      </AppModal>
    </section>
  );
}
