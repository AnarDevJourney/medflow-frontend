import { Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { WeekSummary } from "@features/schedules/components/WeekSummary";
import { useSchedule } from "@features/schedules/hooks/useSchedule";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

// Own weekly schedule (doctors), read-only — an administrator sets it
export function MyScheduleCard() {
  const { t } = useTranslation();
  const can = useCan();
  const { data: me } = useCurrentUser();
  const visible = me?.role === "DOCTOR" && can(["schedules.read", "schedules.read_own"]);
  const schedule = useSchedule(me?.id, visible);
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
    </SettingsCard>
  );
}
