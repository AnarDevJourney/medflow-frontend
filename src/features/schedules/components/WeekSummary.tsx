import { useTranslation } from "react-i18next";
import type { ScheduleDay } from "../services/schedulesService";
import { useScheduleText } from "../hooks/useScheduleText";
import { slotsOf, WEEKDAYS } from "../utils/schedule";
import styles from "./Schedule.module.css";

// Read-only week, Monday to Sunday: hours and appointments per day
export function WeekSummary({ days }: { days: ScheduleDay[] }) {
  const { t } = useTranslation();
  const { dayName } = useScheduleText();
  const byDay = new Map(days.map((day) => [day.dayOfWeek, day]));

  return (
    <ul className={styles.summary}>
      {WEEKDAYS.map((dow) => {
        const day = byDay.get(dow);
        return (
          <li key={dow} className={styles.summaryRow} data-off={!day || undefined}>
            <span className={styles.summaryDay}>{dayName(dow)}</span>
            {day ? (
              <>
                <span className={styles.summaryHours}>
                  {day.startTime} – {day.endTime}
                </span>
                <span className={styles.summaryMeta}>
                  {t("schedules.slotsShort", {
                    count: slotsOf(day),
                    minutes: day.slotMinutes,
                  })}
                </span>
              </>
            ) : (
              <span className={styles.summaryOff}>{t("schedules.dayOff")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
