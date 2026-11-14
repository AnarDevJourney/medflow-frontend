import {
  ArrowLeftOutlined,
  CalendarOutlined,
  HeartOutlined,
  IdcardOutlined,
  ManOutlined,
  UserAddOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton, Tabs } from "antd";
import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { detailStyles as styles, type HeroFact } from "@components/detail-page";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@features/errors/pages/NotFoundPage";
import { PatientTimeline } from "@features/history/components/PatientTimeline";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { formatDate, formatDay, fromNow } from "@lib/dayjs";
import { PATHS } from "@router/paths";
import { AllergyBanner } from "../components/clinical/AllergyBanner";
import { ClinicalTab } from "../components/clinical/ClinicalTab";
import { PatientHero } from "../components/detail/PatientHero";
import { PatientOverview } from "../components/detail/PatientOverview";
import local from "../components/detail/PatientDetail.module.css";
import { PatientModal } from "../components/PatientModal";
import { useConfirmPatientAction } from "../hooks/useConfirmPatientAction";
import { usePatient } from "../hooks/usePatients";
import { ageOf, bloodTypeLabel } from "../utils/patient";

type TabKey = "overview" | "clinical" | "history";

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
      <PatientModal
        open={editing}
        patient={editing ? patient : null}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}
