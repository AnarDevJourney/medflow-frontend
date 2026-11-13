import { Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { TimeOffTypeTag } from "@features/schedules/components/TimeOffTypeTag";
import { WeekSummary } from "@features/schedules/components/WeekSummary";
import { useTimeOff } from "@features/schedules/hooks/useTimeOff";
import { formatPeriod } from "@features/schedules/utils/timeOff";
import timeOffStyles from "@features/schedules/components/TimeOff.module.css";
import { useSchedule } from "@features/schedules/hooks/useSchedule";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

// Own weekly schedule and upcoming time off (doctors), read-only — an
// administrator sets them
export function MyScheduleCard() {
  const { t } = useTranslation();
  const can = useCan();
  const { data: me } = useCurrentUser();
  const visible = me?.role === "DOCTOR" && can(["schedules.read", "schedules.read_own"]);
  const schedule = useSchedule(me?.id, visible);
  const upcoming = useTimeOff(
    { userId: me?.id, scope: "upcoming", sort: "startDate:asc", limit: 5 },
    visible,
  );
  const periods = upcoming.data?.items ?? [];
  if (!visible || schedule.isError) return null;

  return (
    <SettingsCard
      title={t("schedules.profileTitle")}
      description={t("schedules.profileText")}
    >
      {!schedule.data ? (
        <Skeleton active title={false} paragraph={{ rows: 5 }} />
      ) : schedule.data.days.length === 0 ? (
        <p className={styles.note}>{t("schedules.emptyText")}</p>
      ) : (
        <WeekSummary days={schedule.data.days} />
      )}
      {periods.length > 0 && (
        <ul className={timeOffStyles.compactList} aria-label={t("timeOff.title")}>
          {periods.map((p) => (
            <li key={p.id}>
              <TimeOffTypeTag type={p.type} />
              {formatPeriod(p.startDate, p.endDate)}
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}
