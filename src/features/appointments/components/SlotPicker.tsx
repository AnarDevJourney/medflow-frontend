import {
  CalendarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { toClinicTime } from "@lib/dayjs";
import type { Availability, Slot } from "../services/appointmentsService";
import styles from "./BookAppointmentModal.module.css";

// Parts of the day the slots are grouped in (clinic hours)
const PARTS = [
  { key: "morning", until: 12 },
  { key: "afternoon", until: 17 },
  { key: "evening", until: 24 },
] as const;

const timeOf = (iso: string) => toClinicTime(iso).format("HH:mm");

// Free / taken times of one doctor day as buttons. Taken and past times
// stay visible (disabled, with the reason as a tooltip and for screen
// readers), so the desk sees how full the day is.
export function SlotPicker({
  ready,
  loading,
  error,
  data,
  value,
  onChange,
  onRetry,
  invalid,
}: {
  ready: boolean; // a doctor and a day are chosen
  loading: boolean;
  error: unknown;
  data: Availability | undefined;
  value: string | null;
  onChange: (startsAt: string) => void;
  onRetry: () => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();

  if (!ready) {
    return (
      <div className={styles.slotHint}>
        <CalendarOutlined aria-hidden="true" />
        {t("appointments.book.pickDoctorFirst")}
      </div>
    );
  }
  if (error) {
    return (
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
    );
  }
  if (loading || !data) {
    return (
      <div className={styles.slotGrid} aria-busy="true">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton.Button key={i} active block size="default" />
        ))}
      </div>
    );
  }
  if (!data.working) {
    return (
      <Alert
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        title={t(`appointments.notWorking.${data.reason}`)}
        description={t("appointments.book.otherDay")}
      />
    );
  }

  const free = data.slots.filter((s) => s.available).length;
  const groups = PARTS.map((part, index) => ({
    key: part.key,
    slots: data.slots.filter((s) => {
      const hour = toClinicTime(s.startsAt).hour();
      return hour < part.until && (index === 0 || hour >= PARTS[index - 1].until);
    }),
  })).filter((g) => g.slots.length > 0);

  const label = (slot: Slot) =>
    slot.reason
      ? `${timeOf(slot.startsAt)} — ${t(`appointments.slotReason.${slot.reason}`)}`
      : timeOf(slot.startsAt);

  return (
    <div className={styles.slots} data-invalid={invalid || undefined}>
      <div className={styles.slotMeta}>
        <span>
          <ClockCircleOutlined aria-hidden="true" /> {data.start}–{data.end} ·{" "}
          {t("appointments.book.slotLength", { count: data.slotMinutes })}
        </span>
        <span className={free === 0 ? styles.slotNoneFree : styles.slotFree}>
          {t("appointments.book.freeCount", { count: free })}
        </span>
      </div>
      {free === 0 && <p className={styles.slotEmpty}>{t("appointments.book.dayFull")}</p>}
      {groups.map((group) => (
        <div key={group.key} className={styles.slotGroup}>
          <span className={styles.slotGroupTitle}>
            {t(`appointments.book.parts.${group.key}`)}
          </span>
          <div
            className={styles.slotGrid}
            role="radiogroup"
            aria-label={t(`appointments.book.parts.${group.key}`)}
          >
            {group.slots.map((slot) => {
              const selected = value === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={label(slot)}
                  title={slot.reason ? label(slot) : undefined}
                  disabled={!slot.available}
                  className={styles.slot}
                  data-selected={selected || undefined}
                  data-reason={slot.reason}
                  onClick={() => onChange(slot.startsAt)}
                >
                  {timeOf(slot.startsAt)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
