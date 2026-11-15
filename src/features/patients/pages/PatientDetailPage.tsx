import {
  ArrowLeftOutlined,
  CalendarOutlined,
  HeartOutlined,
  IdcardOutlined,
  ManOutlined,
  UserAddOutlined,
  ScheduleOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton, Tabs } from "antd";
import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { detailStyles as styles, type HeroFact } from "@components/detail-page";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { PatientTimeline } from "@features/history/components/PatientTimeline";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, {
  CLINIC_TZ,
  formatDate,
  formatDay,
  fromNow,
  toClinicTime,
} from "@lib/dayjs";
import { AppointmentStatus } from "@models/enums";
import { PATHS } from "@router/paths";
import { AllergyBanner } from "../components/clinical/AllergyBanner";
import { BookAppointmentModal } from "@features/appointments/components/BookAppointmentModal";
import { PatientAppointmentsTab } from "@features/appointments/components/PatientAppointmentsTab";
import { useAppointments } from "@features/appointments/hooks/useAppointments";
import { ClinicalTab } from "../components/clinical/ClinicalTab";
import { PatientHero } from "../components/detail/PatientHero";
import { PatientOverview } from "../components/detail/PatientOverview";
import local from "../components/detail/PatientDetail.module.css";
import { PatientModal } from "../components/PatientModal";
import { useConfirmPatientAction } from "../hooks/useConfirmPatientAction";
import { usePatient } from "../hooks/usePatients";
import { ageOf, bloodTypeLabel } from "../utils/patient";

type TabKey = "overview" | "clinical" | "appointments" | "history";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /patients/:id — everything about one patient. Today: demographics, the
// clinical summary (allergy banner + allergies / conditions tab, clinical
// readers only) and the history; later phases add appointments, visits, lab results, documents and
// invoices as tabs. The open tab lives in ?tab= so links and reloads keep it.
export function PatientDetailPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { id = "" } = useParams<{ id: string }>();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const can = useCan();
  const validId = UUID.test(id);
  const query = usePatient(validId ? id : undefined);
  const patient = query.data;
  const { reactivate } = useConfirmPatientAction();
  const [editing, setEditing] = useState(false);

  const canUpdate = can("patients.update");
  const canChangeStatus = can("patients.deactivate");
  const showHistory = can("history.patient_read");
  const showClinical = can("patients.clinical_read");
  const showAppointments = can("appointments.read");
  const canBook = can("appointments.book") && can("appointments.availability");
  const [booking, setBooking] = useState(false);
  // The next visit for the facts strip (soonest scheduled from today)
  const nextVisit = useAppointments(
    {
      page: 1,
      limit: 1,
      patientId: id,
      from: dayjs().tz(CLINIC_TZ).format("YYYY-MM-DD"),
      status: AppointmentStatus.SCHEDULED,
      sort: "startsAt:asc",
    },
    validId && showAppointments,
  ).data?.items[0];
  // Stable, so the booking modal does not reset while it is open
  const bookingPatient = useMemo(
    () =>
      patient && {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        mrn: patient.mrn,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
      },
    [patient],
  );

  // Back to the list with the filters it had (PatientsPage passes its query)
  const from = (location.state as { from?: string } | null)?.from ?? "";
  const back = (
    <Link to={`${PATHS.patients}${from}`} className={styles.back}>
      <ArrowLeftOutlined /> {t("patientDetail.back")}
    </Link>
  );

  if (!validId || isApiError(query.error, "NOT_FOUND")) return <NotFoundPage />;
  if (isApiError(query.error, "FORBIDDEN")) return <ForbiddenPage />;

  if (query.error) {
    return (
      <div className={styles.page}>
        {back}
        <Alert
          type="error"
          showIcon
          title={errorMessage(query.error)}
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={styles.page}>
        {back}
        <div className={styles.card}>
          <Skeleton active avatar={{ size: 88 }} paragraph={{ rows: 3 }} />
        </div>
      </div>
    );
  }

  const facts: HeroFact[] = [
    {
      key: "age",
      icon: <CalendarOutlined />,
      label: t("patients.columns.age"),
      value: t("patients.years", { count: ageOf(patient.dateOfBirth) }),
      sub: formatDay(patient.dateOfBirth),
    },
    {
      key: "sex",
      icon: patient.gender === "FEMALE" ? <WomanOutlined /> : <ManOutlined />,
      label: t("patients.fields.gender"),
      value: t(`patients.gender.${patient.gender}`),
    },
    {
      key: "blood",
      icon: <HeartOutlined />,
      label: t("patients.fields.bloodType"),
      value: patient.bloodType
        ? bloodTypeLabel(patient.bloodType)
        : t("patients.form.bloodUnknown"),
      tone: patient.bloodType ? undefined : "muted",
    },
    {
      key: "fin",
      icon: <IdcardOutlined />,
      label: t("patients.fields.finCode"),
      value: patient.finCode ?? t("patientDetail.notGiven"),
      tone: patient.finCode ? undefined : "muted",
    },
    {
      key: "registered",
      icon: <UserAddOutlined />,
      label: t("patients.columns.registered"),
      value: formatDate(patient.createdAt),
      sub: fromNow(patient.createdAt),
    },
    ...(showAppointments
      ? [
          {
            key: "nextVisit",
            icon: <ScheduleOutlined />,
            label: t("patientAppointments.nextVisit"),
            value: nextVisit
              ? toClinicTime(nextVisit.startsAt).format("D MMM, HH:mm")
              : t("patientAppointments.none"),
            sub: nextVisit?.doctorName,
            tone: nextVisit ? undefined : ("muted" as const),
          },
        ]
      : []),
  ];

  const tabs = [
    {
      key: "overview",
      label: t("staffDetail.tabs.overview"),
      children: <PatientOverview patient={patient} />,
    },
    ...(showClinical
      ? [
          {
            key: "clinical",
            label: t("patientDetail.tabs.clinical"),
            children: (
              <ClinicalTab
                patient={patient}
                canManage={can("patients.clinical_manage")}
              />
            ),
          },
        ]
      : []),
    ...(showAppointments
      ? [
          {
            key: "appointments",
            label: t("patientDetail.tabs.appointments"),
            children: (
              <PatientAppointmentsTab
                patientId={patient.id}
                onBook={canBook && patient.isActive ? () => setBooking(true) : undefined}
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
            children: <PatientTimeline patientId={patient.id} />,
          },
        ]
      : []),
  ];
  const requested = params.get("tab") as TabKey | null;
  const active = tabs.some((tab) => tab.key === requested) ? requested! : "overview";

  return (
    <div className={styles.page}>
      {back}
      {!patient.isActive && (
        <Alert
          className={local.inactive}
          type="warning"
          showIcon
          title={t("patientDetail.inactiveTitle")}
          description={t("patientDetail.inactiveText")}
          action={
            canChangeStatus && (
              <Button size="small" onClick={() => reactivate(patient)}>
                {t("patients.reactivate")}
              </Button>
            )
          }
        />
      )}
      {showClinical && patient.allergies && (
        <AllergyBanner allergies={patient.allergies} />
      )}
      <PatientHero
        patient={patient}
        facts={facts}
        onEdit={canUpdate && patient.isActive ? () => setEditing(true) : undefined}
        canChangeStatus={canChangeStatus}
        extraActions={
          canBook &&
          patient.isActive && (
            <Button icon={<CalendarOutlined />} onClick={() => setBooking(true)}>
              {t("appointments.bookButton")}
            </Button>
          )
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
      <BookAppointmentModal
        open={booking}
        onClose={() => setBooking(false)}
        patient={bookingPatient}
        lockPatient
      />
      <PatientModal
        open={editing}
        patient={editing ? patient : null}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}
