import { ArrowLeftOutlined, CalendarOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, App, Button, Skeleton } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@components/ui/EmptyState";
import { PageHeader } from "@components/ui/PageHeader";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { useStaffMember } from "@features/staff/hooks/useStaff";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { staffMemberPath } from "@router/paths";
import { ScheduleEditor } from "../components/ScheduleEditor";
import { TimeOffCard } from "../components/TimeOffCard";
import { WeekSummary } from "../components/WeekSummary";
import { useReplaceSchedule, useSchedule } from "../hooks/useSchedule";
import { useScheduleText } from "../hooks/useScheduleText";
import type { ScheduleDay } from "../services/schedulesService";
import { weekTotals } from "../utils/schedule";
import styles from "./SchedulePage.module.css";

// /staff/:userId/schedule — a doctor's weekly working hours and time off. schedules.manage
// edits (active or invited doctors); schedules.read sees anyone's week,
// schedules.read_own only one's own (the backend answers 403 otherwise).
export function SchedulePage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { duration } = useScheduleText();
  const { userId } = useParams<{ userId: string }>();
  const can = useCan();
  const staff = useStaffMember(userId);
  const schedule = useSchedule(userId);
  const save = useReplaceSchedule(userId ?? "");
  // Unsaved edits, so the totals follow the grid while typing
  const [preview, setPreview] = useState<ScheduleDay[] | null>(null);
  // Remounts the editor from the saved week after each save
  const [version, setVersion] = useState(0);

  const error = staff.error ?? schedule.error;
  if (isApiError(error, "FORBIDDEN")) return <ForbiddenPage />;
  if (isApiError(error, "NOT_FOUND")) return <NotFoundPage />;

  const person = staff.data;
  const days = schedule.data?.days;
  const isDoctor = person?.role === "DOCTOR";
  const deactivated = person?.status === "DEACTIVATED";
  const editable = can("schedules.manage") && isDoctor && !deactivated;
  const totals = weekTotals(preview ?? days ?? []);

  const onSave = (next: ScheduleDay[]) =>
    save.mutate(next, {
      onSuccess: () => {
        setPreview(null);
        setVersion((v) => v + 1);
        void message.success(t("schedules.savedToast"));
      },
      onError: (e) => void message.error(errorMessage(e)),
    });

  const back = (
    <Link to={staffMemberPath(userId ?? "")}>
      <Button icon={<ArrowLeftOutlined />}>{t("schedules.backToProfile")}</Button>
    </Link>
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title={t("schedules.title")}
        subtitle={t(editable ? "schedules.subtitleEdit" : "schedules.subtitleView")}
        actions={back}
      />

      {error ? (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error)}
          action={
            <Button
              size="small"
              onClick={() => {
                void staff.refetch();
                void schedule.refetch();
              }}
            >
              {t("common.retry")}
            </Button>
          }
        />
      ) : !person || !days ? (
        <div className={styles.layout}>
          <div className={styles.card}>
            <Skeleton active paragraph={{ rows: 7 }} />
          </div>
          <div className={styles.card}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t("schedules.weekTitle")}</h2>
                {!editable && isDoctor && (
                  <span className={styles.readOnly}>
                    <LockOutlined /> {t("schedules.readOnly")}
                  </span>
                )}
              </header>
              {deactivated && isDoctor && (
                <Alert
                  type="warning"
                  showIcon
                  className={styles.alert}
                  message={t("schedules.deactivatedNote")}
                />
              )}
              {!isDoctor ? (
                <EmptyState
                  icon={<CalendarOutlined />}
                  title={t("schedules.notDoctorTitle")}
                  description={t("schedules.notDoctorText")}
                />
              ) : editable ? (
                <ScheduleEditor
                  key={version}
                  days={days}
                  saving={save.isPending}
                  onSave={onSave}
                  onChange={setPreview}
                />
              ) : days.length === 0 ? (
                <EmptyState
                  icon={<CalendarOutlined />}
                  title={t("schedules.emptyTitle")}
                  description={t("schedules.emptyText")}
                />
              ) : (
                <WeekSummary days={days} />
              )}
            </section>
            {isDoctor && (
              <TimeOffCard
                userId={person.userId}
                doctorName={`${person.firstName} ${person.lastName}`}
                editable={editable}
              />
            )}
          </div>

          <aside className={styles.side}>
            <div className={`${styles.card} ${styles.person}`}>
              <UserAvatar
                firstName={person.firstName}
                lastName={person.lastName}
                size={56}
              />
              <div className={styles.personText}>
                <div className={styles.personName}>
                  {person.firstName} {person.lastName}
                </div>
                <div className={styles.personSub}>
                  {[person.title, person.department?.name].filter(Boolean).join(" · ") ||
                    person.email}
                </div>
                <RoleTag role={person.role} />
              </div>
            </div>
            {isDoctor && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>{t("schedules.totalsTitle")}</h2>
                <dl className={styles.stats}>
                  <div className={styles.stat}>
                    <dt>{t("schedules.totals.days")}</dt>
                    <dd>{totals.workingDays}</dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>{t("schedules.totals.hours")}</dt>
                    <dd>{duration(totals.minutes)}</dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>{t("schedules.totals.slots")}</dt>
                    <dd>{totals.slots}</dd>
                  </div>
                </dl>
                <p className={styles.hint}>{t("schedules.bookingHint")}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
