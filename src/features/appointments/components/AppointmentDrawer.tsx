import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FieldTimeOutlined,
  LoginOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
} from "@components/drawer";
import { StatusBadge } from "@components/ui/StatusBadge";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime } from "@lib/dayjs";
import { patientPath } from "@router/paths";
import { useAppointmentRules } from "../hooks/useAppointmentRules";
import type { Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import styles from "./AppointmentDrawer.module.css";

export interface AppointmentCommands {
  onCheckIn: (a: Appointment) => void;
  onReschedule: (a: Appointment) => void;
  onEdit: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  checkingIn?: boolean;
}

// One appointment: when and with whom, the visit details, what happened to
// it (booked → checked in / cancelled, by whom) and the actions allowed now
export function AppointmentDrawer({
  appointment: selected,
  onClose,
  commands,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  commands: AppointmentCommands;
}) {
  const { t } = useTranslation();
  const appointment = useLastDefined(selected);
  const rulesOf = useAppointmentRules();
  const rules = appointment ? rulesOf(appointment) : null;

  const actions = appointment && rules && (
    <>
      {rules.cancel && (
        <Button
          danger
          icon={<StopOutlined />}
          onClick={() => commands.onCancel(appointment)}
          className={styles.cancel}
        >
          {t("appointments.drawerActions.cancel")}
        </Button>
      )}
      {rules.edit && (
        <Button icon={<EditOutlined />} onClick={() => commands.onEdit(appointment)}>
          {t("appointments.drawerActions.edit")}
        </Button>
      )}
      {rules.reschedule && (
        <Button
          icon={<FieldTimeOutlined />}
          onClick={() => commands.onReschedule(appointment)}
        >
          {t("appointments.drawerActions.reschedule")}
        </Button>
      )}
      {rules.checkIn ? (
        <Button
          type="primary"
          icon={<LoginOutlined />}
          loading={commands.checkingIn}
          onClick={() => commands.onCheckIn(appointment)}
        >
          {t("appointments.drawerActions.checkIn")}
        </Button>
      ) : (
        !rules.cancel && <Button onClick={onClose}>{t("common.close")}</Button>
      )}
    </>
  );

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("appointments.drawerTitle")}
      actions={actions}
      size={520}
    >
      {appointment && (
        <>
          <DetailHeader
            media={
              <span className={styles.media} aria-hidden="true">
                <CalendarOutlined />
              </span>
            }
            title={`${dayLabel(appointment.startsAt)} · ${timeRange(appointment.startsAt, appointment.endsAt)}`}
            subtitle={t(`appointments.types.${appointment.type}`)}
            tags={<StatusBadge status={appointment.status} />}
          />
          <DetailSection title={t("appointments.fields.patient")}>
            <DetailList
              items={[
                {
                  label: t("appointments.fields.patient"),
                  value: (
                    <Link to={patientPath(appointment.patientId)} className={styles.link}>
                      {appointment.patientName} <ArrowRightOutlined aria-hidden="true" />
                    </Link>
                  ),
                },
                { label: t("patients.fields.mrn"), value: appointment.patientMrn },
                { label: t("patients.fields.phone"), value: appointment.patientPhone },
              ]}
            />
          </DetailSection>
          <DetailSection title={t("appointments.visitSection")}>
            <DetailList
              items={[
                { label: t("appointments.fields.doctor"), value: appointment.doctorName },
                {
                  label: t("appointments.fields.department"),
                  value: appointment.departmentName,
                },
                { label: t("appointments.fields.reason"), value: appointment.reason },
                {
                  label: t("appointments.fields.notes"),
                  value: appointment.notes && (
                    <span className={styles.notes}>{appointment.notes}</span>
                  ),
                },
              ]}
            />
          </DetailSection>
          <DetailSection title={t("appointments.timeline.title")}>
            <AppointmentTimeline appointment={appointment} />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}

// What happened to the appointment, oldest first
function AppointmentTimeline({ appointment: a }: { appointment: Appointment }) {
  const { t } = useTranslation();
  const steps: {
    key: string;
    icon: ReactNode;
    tone: string;
    title: string;
    at: string;
    by: string | null;
    note?: string | null;
  }[] = [
    {
      key: "booked",
      icon: <CalendarOutlined />,
      tone: "primary",
      title: t("appointments.timeline.booked"),
      at: a.createdAt,
      by: a.createdByName,
    },
  ];
  if (a.updatedByName && a.updatedAt !== a.createdAt) {
    steps.push({
      key: "changed",
      icon: <EditOutlined />,
      tone: "primary",
      title: t("appointments.timeline.changed"),
      at: a.updatedAt,
      by: a.updatedByName,
    });
  }
  if (a.checkedInAt) {
    steps.push({
      key: "checkedIn",
      icon: <CheckCircleOutlined />,
      tone: "warning",
      title: t("appointments.timeline.checkedIn"),
      at: a.checkedInAt,
      by: a.checkedInByName,
    });
  }
  if (a.cancelledAt) {
    steps.push({
      key: "cancelled",
      icon: <StopOutlined />,
      tone: "muted",
      title: t("appointments.timeline.cancelled"),
      at: a.cancelledAt,
      by: a.cancelledByName,
      note: a.cancellationReason,
    });
  }
  steps.sort((x, y) => x.at.localeCompare(y.at));

  return (
    <ol className={styles.timeline}>
      {steps.map((step) => (
        <li key={step.key} className={styles.step} data-tone={step.tone}>
          <span className={styles.stepIcon} aria-hidden="true">
            {step.icon}
          </span>
          <span className={styles.stepBody}>
            <span className={styles.stepTitle}>{step.title}</span>
            <span className={styles.stepMeta}>
              {formatDateTime(step.at)}
              {step.by && ` · ${step.by}`}
            </span>
            {step.note && <span className={styles.stepNote}>{step.note}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
