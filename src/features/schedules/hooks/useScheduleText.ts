import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// Weekday names and durations in the reader's language
export function useScheduleText() {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      dayName: (day: number) => t(`weekdays.long.${day}`),
      dayShort: (day: number) => t(`weekdays.short.${day}`),
      // 570 → "9 h 30 min"
      duration: (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        if (rest === 0) return t("schedules.duration.hours", { hours });
        if (hours === 0) return t("schedules.duration.minutes", { minutes: rest });
        return t("schedules.duration.hoursMinutes", { hours, minutes: rest });
      },
    }),
    [t],
  );
}
