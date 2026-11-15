import { ArrowRightOutlined, CalendarOutlined } from "@ant-design/icons";
import { Button } from "antd";
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
import type { Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import styles from "./AppointmentDrawer.module.css";

// One appointment, read-only. Status actions (check-in, cancel,
// reschedule) come with 7.2.
export function AppointmentDrawer({
  appointment: selected,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const appointment = useLastDefined(selected);

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("appointments.drawerTitle")}
      actions={<Button onClick={onClose}>{t("common.close")}</Button>}
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
                {
                  label: t("appointments.fields.booked"),
                  value: formatDateTime(appointment.createdAt),
                },
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
