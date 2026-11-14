import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  SunOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton, Tabs } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { PersonTimeline } from "@features/history/components/PersonTimeline";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { useDoctorStatus } from "@features/schedules/hooks/useDoctorStatus";
import { useScheduleText } from "@features/schedules/hooks/useScheduleText";
import { slotsOf, weekTotals } from "@features/schedules/utils/schedule";
import { clinicToday, formatPeriod } from "@features/schedules/utils/timeOff";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { formatDateTime, formatDay, fromNow } from "@lib/dayjs";
import { PATHS } from "@router/paths";
import { useState } from "react";
import { StaffHero, type HeroFact } from "../components/detail/StaffHero";
import { StaffOverview } from "../components/detail/StaffOverview";
import { StaffScheduleTab } from "../components/detail/StaffScheduleTab";
import { StaffProfileModal } from "../components/StaffProfileModal";
import { UserModal } from "../components/UserModal";
import { useStaffMember } from "../hooks/useStaff";
import { useUser } from "../hooks/useUsers";
import styles from "../components/detail/StaffDetail.module.css";

type TabKey = "overview" | "schedule" | "history";

// /staff/:userId — everything about one person. Sections follow the
// viewer's permissions: the account (users.read), a doctor's week and time
// off (schedules.read, or schedules.read_own on oneself), the history
// (history.user_read). The open tab lives in ?tab= so links and reloads keep it.
export function StaffDetailPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { duration } = useScheduleText();
  const { userId = "" } = useParams<{ userId: string }>();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { data: me } = useCurrentUser();
  const can = useCan();
  const staff = useStaffMember(userId);
  const person = staff.data;
  const isMe = me?.id === userId;

  const canReadAccount = can("users.read");
  const account = useUser(userId, canReadAccount);
  const showSchedule =
    person?.role === "DOCTOR" &&
    (can("schedules.read") || (can("schedules.read_own") && isMe));
  const showHistory = can("history.user_read");
  const status = useDoctorStatus(userId, showSchedule);
  const [editing, setEditing] = useState<"profile" | "account" | null>(null);

  // Back to the list with the filters it had (StaffPage passes its query)
  const from = (location.state as { from?: string } | null)?.from ?? "";
  const back = (
    <Link to={`${PATHS.staff}${from}`} className={styles.back}>
      <ArrowLeftOutlined /> {t("staffDetail.back")}
    </Link>
  );

  if (isApiError(staff.error, "FORBIDDEN")) return <ForbiddenPage />;
  if (isApiError(staff.error, "NOT_FOUND")) return <NotFoundPage />;

  if (staff.error) {
    return (
      <div className={styles.page}>
        {back}
        <Alert
          type="error"
          showIcon
          message={errorMessage(staff.error)}
          action={
            <Button size="small" onClick={() => void staff.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  if (!person) {
    return (
      <div className={styles.page}>
        {back}
        <div className={styles.card}>
          <Skeleton active avatar={{ size: 88 }} paragraph={{ rows: 3 }} />
        </div>
      </div>
    );
  }

  const facts: HeroFact[] = [];
  if (showSchedule && !status.loading) {
    const today = status.today;
    facts.push(
      status.away
        ? {
            key: "today",
            icon: <ClockCircleOutlined />,
            label: t("staffDetail.facts.today"),
            value: t(`timeOff.types.${status.away.type}`),
            sub: t("timeOff.awayUntil", { date: formatDay(status.away.endDate) }),
            tone: "warning",
          }
        : today
          ? {
              key: "today",
              icon: <ClockCircleOutlined />,
              label: t("staffDetail.facts.today"),
              value: `${today.startTime} – ${today.endTime}`,
              sub: t("schedules.appointments", { count: slotsOf(today) }),
              tone: "success",
            }
          : {
              key: "today",
              icon: <ClockCircleOutlined />,
              label: t("staffDetail.facts.today"),
              value: t(
                status.days.length ? "schedules.dayOff" : "staffDetail.facts.noSchedule",
              ),
              tone: "muted",
            },
    );
    if (status.days.length > 0) {
      const totals = weekTotals(status.days);
      facts.push({
        key: "week",
        icon: <CalendarOutlined />,
        label: t("staffDetail.facts.week"),
        value: t("staffDetail.facts.weekValue", {
          count: totals.workingDays,
          hours: duration(totals.minutes),
        }),
        sub: t("schedules.appointments", { count: totals.slots }),
      });
    }
    facts.push({
      key: "next",
      icon: <SunOutlined />,
      label: t("staffDetail.facts.nextTimeOff"),
      value: status.next
        ? formatPeriod(status.next.startDate, status.next.endDate)
        : t("staffDetail.facts.noneScheduled"),
      sub: status.next && t(`timeOff.types.${status.next.type}`),
      tone: status.next ? undefined : "muted",
    });
  }
  facts.push(tenureFact());
  if (canReadAccount && account.data) {
    const last = account.data.lastLoginAt;
    facts.push({
      key: "login",
      icon: <LoginOutlined />,
      label: t("staff.lastLogin"),
      value: last ? fromNow(last) : t("staff.never"),
      sub: last && formatDateTime(last),
      tone: last ? undefined : "muted",
    });
  }

  // How long the person has worked here (hire date), else when they joined MedFlow
  function tenureFact(): HeroFact {
    const base = {
      key: "tenure",
      icon: <TeamOutlined />,
      label: t("staffDetail.facts.tenure"),
    };
    if (!person!.hireDate) {
      return {
        ...base,
        label: t("staffDetail.addedAt"),
        value: formatDay(dayjs(person!.createdAt).format("YYYY-MM-DD")),
        sub: fromNow(person!.createdAt),
      };
    }
    const hire = dayjs(person!.hireDate);
    const months = dayjs(clinicToday()).diff(hire, "month");
    const since = t("staffDetail.tenure.since", { date: formatDay(person!.hireDate) });
    if (months < 0) {
      return {
        ...base,
        value: t("staffDetail.tenure.notStarted"),
        sub: t("staffDetail.tenure.startsOn", { date: formatDay(person!.hireDate) }),
        tone: "muted",
      };
    }
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const value =
      months === 0
        ? t("staffDetail.tenure.lessThanMonth")
        : [
            years > 0 && t("staffDetail.tenure.years", { count: years }),
            rest > 0 && t("staffDetail.tenure.months", { count: rest }),
          ]
            .filter(Boolean)
            .join(" ");
    return { ...base, value, sub: since };
  }

  const tabs = [
    {
      key: "overview",
      label: t("staffDetail.tabs.overview"),
      children: (
        <StaffOverview
          staff={person}
          account={account.data}
          showAccount={canReadAccount}
        />
      ),
    },
    ...(showSchedule
      ? [
          {
            key: "schedule",
            label: t("staffDetail.tabs.schedule"),
            children: (
              <StaffScheduleTab
                staff={person}
                status={status}
                canManage={can("schedules.manage")}
              />
            ),
          },
        ]
      : []),
    ...(showHistory
      ? [
          {
            key: "history",
            label: t("staffDetail.tabs.history"),
            children: <PersonTimeline userId={person.userId} />,
          },
        ]
      : []),
  ];
  const requested = params.get("tab") as TabKey | null;
  const active = tabs.some((tab) => tab.key === requested) ? requested! : "overview";

  return (
    <div className={styles.page}>
      {back}
      <StaffHero
        staff={person}
        isMe={isMe}
        facts={facts}
        onEditProfile={can("staff.update") ? () => setEditing("profile") : undefined}
        onEditAccount={
          canReadAccount && can("users.update") ? () => setEditing("account") : undefined
        }
      />
      <Tabs
        className={styles.tabs}
        activeKey={active}
        onChange={(key) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (key === "overview") next.delete("tab");
              else next.set("tab", key);
              return next;
            },
            { replace: true, state: location.state },
          )
        }
        items={tabs}
      />
      <StaffProfileModal
        staff={editing === "profile" ? person : null}
        onClose={() => setEditing(null)}
      />
      <UserModal
        userId={editing === "account" ? person.userId : null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
