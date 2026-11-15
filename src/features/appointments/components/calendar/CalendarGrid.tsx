import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "@lib/dayjs";
import type { AppointmentStatus } from "@models/enums";
import { STATUS_COLOR } from "@utils/statusColors";
import type { Appointment } from "../../services/appointmentsService";
import {
  clinicToday,
  durationOf,
  gridRange,
  hhmm,
  instantOf,
  isFree,
  lanesOf,
  minutesOf,
  slotStarts,
  toMinutes,
  type CalendarColumn,
} from "./model";
import styles from "./Calendar.module.css";

// 1 minute = 1.6 px → a 30-minute slot is 48 px tall
const PX = 1.6;

export interface SlotTarget {
  column: CalendarColumn;
  minutes: number;
}

interface CalendarGridProps {
  columns: CalendarColumn[];
  headerMode: "doctor" | "day";
  onOpen: (appointment: Appointment) => void;
  // undefined = the user cannot book (no "+" on free slots)
  onSlotClick?: (target: SlotTarget) => void;
  canDrag: (appointment: Appointment) => boolean;
  onMove: (appointment: Appointment, target: SlotTarget) => void;
}

// Minutes since the clinic's midnight, now; re-rendered every minute
function useNowMinutes() {
  const [now, setNow] = useState(() => minutesOf(new Date().toISOString()));
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(minutesOf(new Date().toISOString())),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

// The time grid: a time axis on the left, one column per doctor (day view)
// or per day (week view). Working hours are plain, the rest hatched; cards
// sit at their time; free future slots can be clicked (book) or receive a
// dragged card (reschedule).
export function CalendarGrid({
  columns,
  headerMode,
  onOpen,
  onSlotClick,
  canDrag,
  onMove,
}: CalendarGridProps) {
  const { t } = useTranslation();
  const range = useMemo(() => gridRange(columns), [columns]);
  const height = (range.end - range.start) * PX;
  const today = clinicToday();
  const now = useNowMinutes();
  const [dragging, setDragging] = useState<Appointment | null>(null);
  const sensors = useSensors(
    // a small move first, so a click on a card still opens it
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const hours: number[] = [];
  for (let m = range.start; m <= range.end; m += 60) hours.push(m);

  const isPast = (column: CalendarColumn, minutes: number) =>
    column.date < today || (column.date === today && minutes <= now);

  const onDragStart = (event: DragStartEvent) =>
    setDragging((event.active.data.current as { appointment: Appointment }).appointment);
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const appointment = (event.active.data.current as { appointment: Appointment })
      .appointment;
    const target = event.over?.data.current as
      (SlotTarget & { valid: boolean }) | undefined;
    if (!target?.valid) return;
    const same =
      target.column.doctorId === appointment.doctorId &&
      instantOf(target.column.date, target.minutes) ===
        new Date(appointment.startsAt).toISOString();
    if (!same) onMove(appointment, target);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div
        className={styles.scroller}
        style={{ "--columns": columns.length } as CSSProperties}
        data-mode={headerMode}
      >
        <div className={styles.grid}>
          {/* Header row */}
          <div className={styles.corner} />
          {columns.map((column) => (
            <ColumnHeader
              key={column.key}
              column={column}
              mode={headerMode}
              isToday={column.date === today}
            />
          ))}

          {/* Time axis */}
          <div className={styles.axis} style={{ height }}>
            {hours.map((m) => (
              <span
                key={m}
                className={styles.hour}
                style={{ top: (m - range.start) * PX }}
              >
                {hhmm(m)}
              </span>
            ))}
          </div>

          {/* Columns */}
          {columns.map((column) => {
            const day = column.day;
            const lanes = lanesOf(column.appointments);
            const slotLength = day?.working ? day.slotMinutes : 30;
            return (
              <div
                key={column.key}
                className={styles.column}
                style={{ height }}
                data-today={column.date === today || undefined}
              >
                {/* Working hours over the hatched background */}
                {day?.working && (
                  <div
                    className={styles.working}
                    style={{
                      top: (toMinutes(day.start) - range.start) * PX,
                      height: (toMinutes(day.end) - toMinutes(day.start)) * PX,
                    }}
                  />
                )}
                {!day?.working && day && (
                  <span className={styles.offLabel}>
                    {t(`appointments.calendar.off.${day.reason}`)}
                  </span>
                )}
                {hours.map((m) => (
                  <span
                    key={m}
                    className={styles.hourLine}
                    style={{ top: (m - range.start) * PX }}
                  />
                ))}
                {/* Free / taken slots: click to book, drop to move */}
                {slotStarts(day).map((m) => (
                  <SlotCell
                    key={m}
                    column={column}
                    minutes={m}
                    top={(m - range.start) * PX}
                    height={slotLength * PX}
                    past={isPast(column, m)}
                    free={isFree(column, m, slotLength, dragging?.id)}
                    dragging={Boolean(dragging)}
                    onClick={onSlotClick}
                  />
                ))}
                {column.date === today && now >= range.start && now <= range.end && (
                  <span
                    className={styles.nowLine}
                    style={{ top: (now - range.start) * PX }}
                    aria-hidden="true"
                  />
                )}
                {column.appointments.map((a) => {
                  const lane = lanes.get(a.id) ?? { lane: 0, of: 1 };
                  return (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      top={(minutesOf(a.startsAt) - range.start) * PX}
                      height={durationOf(a) * PX}
                      lane={lane}
                      draggable={canDrag(a)}
                      faded={dragging?.id === a.id}
                      onOpen={onOpen}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging && (
          <CardBody
            appointment={dragging}
            height={durationOf(dragging) * PX}
            className={styles.overlay}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ColumnHeader({
  column,
  mode,
  isToday,
}: {
  column: CalendarColumn;
  mode: "doctor" | "day";
  isToday: boolean;
}) {
  const { t } = useTranslation();
  const day = column.day;
  const off = day && !day.working ? t(`appointments.calendar.off.${day.reason}`) : null;
  return (
    <div className={styles.header} data-today={isToday || undefined}>
      {mode === "doctor" ? (
        <>
          <span className={styles.headerTitle}>{column.doctorName}</span>
          <span className={styles.headerSub}>
            {off ??
              (day?.working
                ? `${day.start}–${day.end}`
                : (column.departmentName ?? t("appointments.calendar.noSchedule")))}
          </span>
        </>
      ) : (
        <>
          <span className={styles.headerTitle}>
            {dayjs(column.date).format("dd")}{" "}
            <span className={styles.headerDate}>
              {dayjs(column.date).format("D MMM")}
            </span>
          </span>
          <span className={styles.headerSub}>
            {off ?? (day?.working ? `${day.start}–${day.end}` : "—")}
          </span>
        </>
      )}
    </div>
  );
}

function SlotCell({
  column,
  minutes,
  top,
  height,
  past,
  free,
  dragging,
  onClick,
}: {
  column: CalendarColumn;
  minutes: number;
  top: number;
  height: number;
  past: boolean;
  free: boolean;
  dragging: boolean;
  onClick?: (target: SlotTarget) => void;
}) {
  const { t } = useTranslation();
  const valid = free && !past;
  const { setNodeRef, isOver } = useDroppable({
    id: `${column.key}|${minutes}`,
    data: { column, minutes, valid },
    disabled: past,
  });
  const style = { top, height };
  if (past || (!dragging && !free)) {
    return (
      <span
        ref={setNodeRef}
        className={styles.slot}
        style={style}
        data-past={past || undefined}
      />
    );
  }
  const label = t("appointments.calendar.bookAt", {
    time: hhmm(minutes),
    doctor: column.doctorName,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={styles.slot}
      style={style}
      data-free={valid || undefined}
      data-over={isOver ? (valid ? "ok" : "bad") : undefined}
      disabled={!onClick || dragging || !valid}
      aria-label={label}
      title={onClick && !dragging ? label : undefined}
      onClick={() => onClick?.({ column, minutes })}
    >
      {onClick && !dragging && <span className={styles.slotPlus}>+ {hhmm(minutes)}</span>}
    </button>
  );
}

function AppointmentCard({
  appointment,
  top,
  height,
  lane,
  draggable,
  faded,
  onOpen,
}: {
  appointment: Appointment;
  top: number;
  height: number;
  lane: { lane: number; of: number };
  draggable: boolean;
  faded: boolean;
  onOpen: (a: Appointment) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: appointment.id,
    data: { appointment },
    disabled: !draggable,
  });
  const width = 100 / lane.of;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      className={styles.cardButton}
      style={{
        top: top + 1,
        height: Math.max(height - 2, 20),
        left: `calc(${lane.lane * width}% + 3px)`,
        width: `calc(${width}% - 6px)`,
        opacity: faded ? 0.35 : undefined,
      }}
      data-draggable={draggable || undefined}
      aria-label={`${appointment.patientName}, ${t(`appointmentStatus.${appointment.status}`)}`}
      aria-roledescription={draggable ? t("appointments.calendar.draggable") : undefined}
      onClick={() => onOpen(appointment)}
    >
      <CardBody appointment={appointment} height={height} />
    </button>
  );
}

function CardBody({
  appointment: a,
  height,
  className,
}: {
  appointment: Appointment;
  height: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const compact = height < 40;
  return (
    <span
      className={[styles.card, className].filter(Boolean).join(" ")}
      style={
        {
          "--status": STATUS_COLOR[a.status as AppointmentStatus],
          height: className ? Math.max(height - 2, 20) : undefined,
        } as CSSProperties
      }
      data-status={a.status}
      data-compact={compact || undefined}
    >
      <span className={styles.cardLine}>
        <span className={styles.cardTime}>{hhmm(minutesOf(a.startsAt))}</span>
        <span className={styles.cardName}>{a.patientName}</span>
      </span>
      {!compact && (
        <span className={styles.cardMeta}>
          {a.patientMrn} · {t(`appointments.types.${a.type}`)}
        </span>
      )}
    </span>
  );
}
