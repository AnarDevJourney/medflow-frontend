import { CopyOutlined } from "@ant-design/icons";
import { Button, Select, Switch, TimePicker, Tooltip } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "@lib/dayjs";
import type { ScheduleDay } from "../services/schedulesService";
import { useScheduleText } from "../hooks/useScheduleText";
import { dayProblem, SLOT_OPTIONS, slotsOf, WEEKDAYS } from "../utils/schedule";
import styles from "./Schedule.module.css";

interface Row {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}
type Rows = Record<number, Row>;

const DEFAULT_ROW: Omit<Row, "enabled"> = {
  startTime: "09:00",
  endTime: "17:00",
  slotMinutes: 30,
};

// A day off keeps the hours it had, so switching it back on restores them
const toRows = (days: ScheduleDay[]): Rows => {
  const byDay = new Map(days.map((day) => [day.dayOfWeek, day]));
  return Object.fromEntries(
    WEEKDAYS.map((dow) => {
      const day = byDay.get(dow);
      return [dow, day ? { enabled: true, ...day } : { enabled: false, ...DEFAULT_ROW }];
    }),
  );
};

const toDays = (rows: Rows): ScheduleDay[] =>
  WEEKDAYS.filter((dow) => rows[dow].enabled).map((dow) => ({
    dayOfWeek: dow,
    startTime: rows[dow].startTime,
    endTime: rows[dow].endTime,
    slotMinutes: rows[dow].slotMinutes,
  }));

const sameWeek = (a: ScheduleDay[], b: ScheduleDay[]) =>
  JSON.stringify(a) === JSON.stringify(b);

// Weekly grid: one row per weekday — on/off, hours, appointment length.
// The parent remounts it (key) after a save to start from the saved week.
export function ScheduleEditor({
  days,
  saving,
  onSave,
  onChange,
}: {
  days: ScheduleDay[];
  saving: boolean;
  onSave: (days: ScheduleDay[]) => void;
  onChange?: (days: ScheduleDay[]) => void; // live preview for the summary
}) {
  const { t } = useTranslation();
  const { dayName } = useScheduleText();
  const [rows, setRows] = useState<Rows>(() => toRows(days));

  const current = useMemo(() => toDays(rows), [rows]);
  const dirty = !sameWeek(current, days);
  const problems = WEEKDAYS.filter(
    (dow) => rows[dow].enabled && dayProblem({ dayOfWeek: dow, ...rows[dow] }),
  );

  const update = (next: Rows) => {
    setRows(next);
    onChange?.(toDays(next));
  };
  const patch = (dow: number, change: Partial<Row>) =>
    update({ ...rows, [dow]: { ...rows[dow], ...change } });

  // These hours on every working day (the usual case: same hours all week)
  const copyToWorkingDays = (dow: number) => {
    const { startTime, endTime, slotMinutes } = rows[dow];
    update(
      Object.fromEntries(
        WEEKDAYS.map((d) => [
          d,
          rows[d].enabled ? { ...rows[d], startTime, endTime, slotMinutes } : rows[d],
        ]),
      ),
    );
  };

  const timeValue = (time: string) => dayjs(time, "HH:mm");

  return (
    <div className={styles.editor}>
      <div className={styles.editorHead} aria-hidden="true">
        <span>{t("schedules.columns.day")}</span>
        <span>{t("schedules.columns.hours")}</span>
        <span>{t("schedules.columns.slot")}</span>
        <span>{t("schedules.columns.appointments")}</span>
        <span />
      </div>
      {WEEKDAYS.map((dow) => {
        const row = rows[dow];
        const day = { dayOfWeek: dow, ...row };
        const problem = row.enabled ? dayProblem(day) : null;
        return (
          <div
            key={dow}
            className={styles.editorRow}
            data-off={!row.enabled || undefined}
            data-invalid={problem ? true : undefined}
          >
            <label className={styles.dayToggle}>
              <Switch
                size="small"
                checked={row.enabled}
                onChange={(enabled) => patch(dow, { enabled })}
                aria-label={dayName(dow)}
              />
              <span className={styles.dayName}>{dayName(dow)}</span>
            </label>

            {row.enabled ? (
              <>
                <div className={styles.hours}>
                  <TimePicker
                    value={timeValue(row.startTime)}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    needConfirm={false}
                    showNow={false}
                    status={problem === "endBeforeStart" ? "error" : undefined}
                    aria-label={t("schedules.start", { day: dayName(dow) })}
                    onChange={(value) =>
                      value && patch(dow, { startTime: value.format("HH:mm") })
                    }
                    className={styles.time}
                  />
                  <span className={styles.dash}>–</span>
                  <TimePicker
                    value={timeValue(row.endTime)}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    needConfirm={false}
                    showNow={false}
                    status={problem ? "error" : undefined}
                    aria-label={t("schedules.end", { day: dayName(dow) })}
                    onChange={(value) =>
                      value && patch(dow, { endTime: value.format("HH:mm") })
                    }
                    className={styles.time}
                  />
                </div>
                <Select
                  value={row.slotMinutes}
                  onChange={(slotMinutes) => patch(dow, { slotMinutes })}
                  options={SLOT_OPTIONS.map((m) => ({
                    value: m,
                    label: t("schedules.minutes", { count: m }),
                  }))}
                  aria-label={t("schedules.columns.slot")}
                  className={styles.slot}
                />
                <span className={styles.count}>
                  {problem ? (
                    <span className={styles.problem}>
                      {t(`schedules.problems.${problem}`)}
                    </span>
                  ) : (
                    t("schedules.appointments", { count: slotsOf(day) })
                  )}
                </span>
                <Tooltip title={t("schedules.copyToAll")}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    aria-label={t("schedules.copyToAll")}
                    onClick={() => copyToWorkingDays(dow)}
                  />
                </Tooltip>
              </>
            ) : (
              <span className={styles.offText}>{t("schedules.dayOff")}</span>
            )}
          </div>
        );
      })}
      <div className={styles.editorFooter}>
        <span className={styles.footerNote}>
          {problems.length > 0
            ? t("schedules.fixProblems")
            : dirty
              ? t("schedules.unsaved")
              : t("schedules.saved")}
        </span>
        <Button disabled={!dirty || saving} onClick={() => update(toRows(days))}>
          {t("common.cancel")}
        </Button>
        <Button
          type="primary"
          disabled={!dirty || problems.length > 0}
          loading={saving}
          onClick={() => onSave(current)}
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
