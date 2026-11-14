import { useTranslation } from "react-i18next";
import dayjs from "@lib/dayjs";
import { isoWeekday } from "../hooks/useDoctorStatus";
import { useScheduleText } from "../hooks/useScheduleText";
import { useTimeOff } from "../hooks/useTimeOff";
import type { ScheduleDay } from "../services/schedulesService";
import { minutesOf, slotsOf, WEEKDAYS } from "../utils/schedule";
import { clinicToday } from "../utils/timeOff";
import { TimeOffTypeTag } from "./TimeOffTypeTag";
import styles from "./WeekTimeline.module.css";

// The current week, Monday to Sunday, as bars on one hour scale. Today is
// marked; days inside a time off period are hatched with its type.
export function WeekTimeline({ userId, days }: { userId: string; days: ScheduleDay[] }) {
  const { t } = useTranslation();
  const { dayName, dayShort } = useScheduleText();
  const today = clinicToday();
  const monday = dayjs(today).subtract(isoWeekday(today) - 1, "day");
  const dates = WEEKDAYS.map((dow) => monday.add(dow - 1, "day").format("YYYY-MM-DD"));
  const away = useTimeOff({
    userId,
    from: dates[0],
    to: dates[6],
    sort: "startDate:asc",
    limit: 10,
  }).data?.items;
  const byDay = new Map(days.map((day) => [day.dayOfWeek, day]));

  // Hour scale: from the earliest start to the latest end (8–18 when empty)
  let first = 8;
  let last = 18;
  if (days.length > 0) {
    first = Math.floor(Math.min(...days.map((d) => minutesOf(d.startTime))) / 60);
    last = Math.ceil(Math.max(...days.map((d) => minutesOf(d.endTime))) / 60);
  }
  if (last - first < 4) last = Math.min(24, first + 4);
  const span = (last - first) * 60;
  const step = last - first > 8 ? 2 : 1;
  const ticks: number[] = [];
  for (let hour = first; hour <= last; hour += step) ticks.push(hour);
  const at = (minutes: number) => `${((minutes - first * 60) / span) * 100}%`;

  return (
    <div className={styles.timeline}>
      <div className={styles.scale} aria-hidden="true">
        <span />
        <span className={styles.ticks}>
          {ticks.map((hour, index) => (
            <span
              key={hour}
              className={styles.tick}
              data-minor={(index % 2 === 1 && index !== ticks.length - 1) || undefined}
              style={{ left: at(hour * 60) }}
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </span>
        <span />
      </div>
      <ul className={styles.rows}>
        {WEEKDAYS.map((dow, index) => {
          const date = dates[index];
          const day = byDay.get(dow);
          const off = away?.find((p) => p.startDate <= date && date <= p.endDate);
          const isToday = date === today;
          return (
            <li key={dow} className={styles.row} data-today={isToday || undefined}>
              <span className={styles.day}>
                <span className={styles.dayName}>
                  <span className={styles.long}>{dayName(dow)}</span>
                  <span className={styles.short}>{dayShort(dow)}</span>
                </span>
                <span className={styles.date}>
                  {isToday ? t("staffDetail.week.today") : dayjs(date).format("DD MMM")}
                </span>
              </span>
              <span className={styles.track} data-off={!day || undefined}>
                {ticks.map((hour) => (
                  <span
                    key={hour}
                    className={styles.grid}
                    style={{ left: at(hour * 60) }}
                    aria-hidden="true"
                  />
                ))}
                {day && (
                  <span
                    className={styles.bar}
                    data-away={off ? true : undefined}
                    style={{
                      left: at(minutesOf(day.startTime)),
                      width: `${((minutesOf(day.endTime) - minutesOf(day.startTime)) / span) * 100}%`,
                    }}
                  />
                )}
              </span>
              <span className={styles.info}>
                {off ? (
                  <TimeOffTypeTag type={off.type} />
                ) : day ? (
                  <>
                    <span className={styles.hours}>
                      {day.startTime} – {day.endTime}
                    </span>
                    <span className={styles.meta}>
                      {t("schedules.slotsShort", {
                        count: slotsOf(day),
                        minutes: day.slotMinutes,
                      })}
                    </span>
                  </>
                ) : (
                  <span className={styles.meta}>{t("schedules.dayOff")}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
