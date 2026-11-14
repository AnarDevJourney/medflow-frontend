import { CalendarOutlined } from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@components/ui/EmptyState";
import { clinicToday, formatPeriod } from "@features/schedules/utils/timeOff";
import { TimeOffCard } from "@features/schedules/components/TimeOffCard";
import { WeekTimeline } from "@features/schedules/components/WeekTimeline";
import { useScheduleText } from "@features/schedules/hooks/useScheduleText";
import { isoWeekday, type DoctorStatus } from "@features/schedules/hooks/useDoctorStatus";
import { weekTotals } from "@features/schedules/utils/schedule";
import { staffSchedulePath } from "@router/paths";
import dayjs from "@lib/dayjs";
import type { StaffMember } from "../../services/staffService";
import { InfoCard } from "@components/detail-page";
import { detailStyles as styles } from "@components/detail-page";

// A doctor's week (this week's dates, time off marked) and every leave
// period. Hours are edited on the schedule page.
export function StaffScheduleTab({
  staff,
  status,
  canManage,
}: {
  staff: StaffMember;
  status: DoctorStatus;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const { duration } = useScheduleText();
  const deactivated = staff.status === "DEACTIVATED";
  const editable = canManage && !deactivated;
  const totals = weekTotals(status.days);
  const today = clinicToday();
  const monday = dayjs(today).subtract(isoWeekday(today) - 1, "day");

  return (
    <div className={styles.stack}>
      <InfoCard
        icon={<CalendarOutlined />}
        title={t("schedules.weekTitle")}
        action={
          <Link to={staffSchedulePath(staff.userId)}>
            <Button icon={<CalendarOutlined />}>
              {t(editable ? "schedules.edit" : "schedules.open")}
            </Button>
          </Link>
        }
      >
        {deactivated && (
          <Alert
            type="warning"
            showIcon
            className={styles.alert}
            message={t("schedules.deactivatedNote")}
          />
        )}
        {status.loading ? (
          <Skeleton active title={false} paragraph={{ rows: 7 }} />
        ) : status.days.length === 0 ? (
          <EmptyState
            compact
            icon={<CalendarOutlined />}
            title={t("schedules.emptyTitle")}
            description={t("schedules.emptyText")}
          />
        ) : (
          <>
            <p className={styles.weekMeta}>
              {t("staffDetail.week.range", {
                period: formatPeriod(
                  monday.format("YYYY-MM-DD"),
                  monday.add(6, "day").format("YYYY-MM-DD"),
                ),
              })}
              {" · "}
              {t("staffDetail.week.totals", {
                days: totals.workingDays,
                hours: duration(totals.minutes),
                slots: totals.slots,
              })}
            </p>
            <WeekTimeline userId={staff.userId} days={status.days} />
          </>
        )}
      </InfoCard>
      <TimeOffCard
        userId={staff.userId}
        doctorName={`${staff.firstName} ${staff.lastName}`}
        editable={editable}
      />
    </div>
  );
}
