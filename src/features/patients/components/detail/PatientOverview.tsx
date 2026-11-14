import {
  AlertOutlined,
  FileTextOutlined,
  IdcardOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { InfoCard, detailStyles as styles } from "@components/detail-page";
import { DetailList } from "@components/drawer";
import { formatDay } from "@lib/dayjs";
import type { Patient } from "../../services/patientsService";
import { bloodTypeLabel } from "../../utils/patient";

// Demographics, contacts, the emergency contact and front-desk notes
export function PatientOverview({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const hasEmergency = Boolean(
    patient.emergencyContactName ||
    patient.emergencyContactPhone ||
    patient.emergencyContactRelation,
  );

  return (
    <div className={styles.overview}>
      <div className={styles.column}>
        <InfoCard icon={<IdcardOutlined />} title={t("patients.form.personal")}>
          <DetailList
            items={[
              { label: t("patients.fields.firstName"), value: patient.firstName },
              { label: t("patients.fields.lastName"), value: patient.lastName },
              { label: t("patients.fields.fatherName"), value: patient.fatherName },
              {
                label: t("patients.fields.dateOfBirth"),
                value: formatDay(patient.dateOfBirth),
              },
              {
                label: t("patients.fields.gender"),
                value: t(`patients.gender.${patient.gender}`),
              },
              {
                label: t("patients.fields.bloodType"),
                value: patient.bloodType && bloodTypeLabel(patient.bloodType),
              },
              { label: t("patients.fields.finCode"), value: patient.finCode },
            ]}
          />
        </InfoCard>
        <InfoCard icon={<FileTextOutlined />} title={t("patients.fields.notes")}>
          {patient.notes ? (
            <p className={styles.bio}>{patient.notes}</p>
          ) : (
            <p className={styles.placeholder}>{t("patientDetail.noNotes")}</p>
          )}
        </InfoCard>
      </div>

      <div className={styles.column}>
        <InfoCard icon={<PhoneOutlined />} title={t("patients.form.contact")}>
          <DetailList
            items={[
              {
                label: t("patients.fields.phone"),
                value: (
                  <a href={`tel:${patient.phone}`} className={styles.link}>
                    {patient.phone}
                  </a>
                ),
              },
              {
                label: t("patients.fields.email"),
                value: patient.email && (
                  <a href={`mailto:${patient.email}`} className={styles.link}>
                    {patient.email}
                  </a>
                ),
              },
              { label: t("patients.fields.address"), value: patient.address },
            ]}
          />
        </InfoCard>
        <InfoCard icon={<AlertOutlined />} title={t("patients.form.emergency")}>
          {hasEmergency ? (
            <DetailList
              items={[
                {
                  label: t("patients.fields.emergencyContactName"),
                  value: patient.emergencyContactName,
                },
                {
                  label: t("patients.fields.emergencyContactRelation"),
                  value: patient.emergencyContactRelation,
                },
                {
                  label: t("patients.fields.emergencyContactPhone"),
                  value: patient.emergencyContactPhone && (
                    <a
                      href={`tel:${patient.emergencyContactPhone}`}
                      className={styles.link}
                    >
                      {patient.emergencyContactPhone}
                    </a>
                  ),
                },
              ]}
            />
          ) : (
            <p className={styles.placeholder}>{t("patientDetail.noEmergency")}</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
