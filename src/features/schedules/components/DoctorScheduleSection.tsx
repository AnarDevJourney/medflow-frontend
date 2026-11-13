import { CalendarOutlined } from "@ant-design/icons";
import { Button, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DetailSection } from "@components/drawer";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { useCan } from "@features/permissions/hooks/usePermissions";
import type { StaffMember } from "@features/staff/services/staffService";
import { staffSchedulePath } from "@router/paths";
import { useSchedule } from "../hooks/useSchedule";
import styles from "./Schedule.module.css";
import { WeekSummary } from "./WeekSummary";

// The doctor's week inside the staff drawer, for those who may see it
// (schedules.read, or schedules.read_own on one's own profile)
export function DoctorScheduleSection({ staff }: { staff: StaffMember }) {
  const { t } = useTranslation();
  const can = useCan();
  const { data: me } = useCurrentUser();
  const visible =
    staff.role === "DOCTOR" &&
    (can("schedules.read") || (can("schedules.read_own") && me?.id === staff.userId));
  const schedule = useSchedule(staff.userId, visible);
  if (!visible || schedule.isError) return null;

  const editable = can("schedules.manage") && staff.status !== "DEACTIVATED";

  return (
    <DetailSection title={t("schedules.drawerSection")}>
      {schedule.data ? (
        schedule.data.days.length > 0 ? (
          <WeekSummary days={schedule.data.days} />
        ) : (
          <p className={styles.sectionEmpty}>{t("schedules.emptyText")}</p>
        )
      ) : (
        <Skeleton active title={false} paragraph={{ rows: 4 }} />
      )}
      <Link to={staffSchedulePath(staff.userId)} className={styles.sectionLink}>
        <Button icon={<CalendarOutlined />}>
          {t(editable ? "schedules.edit" : "schedules.open")}
        </Button>
      </Link>
    </DetailSection>
  );
}
