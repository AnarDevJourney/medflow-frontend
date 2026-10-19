import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { AppointmentStatus } from "@models/enums";
import { STATUS_COLOR } from "@utils/statusColors";
import styles from "./StatusBadge.module.css";

// Appointment status: colored dot + translated text (never color alone)
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={styles.badge}
      style={{ "--status": STATUS_COLOR[status] } as CSSProperties}
    >
      <span className={styles.dot} aria-hidden="true" />
      {t(`appointmentStatus.${status}`)}
    </span>
  );
}
