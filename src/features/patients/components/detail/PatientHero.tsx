import {
  EditOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  HeroFacts,
  type HeroFact,
  detailStyles as styles,
} from "@components/detail-page";
import { UserAvatar } from "@components/ui/UserAvatar";
import { useConfirmPatientAction } from "../../hooks/useConfirmPatientAction";
import type { Patient } from "../../services/patientsService";
import { fullName } from "../../utils/patient";
import { PatientStatusTag } from "../PatientStatusTag";
import local from "./PatientDetail.module.css";

// Patient identity (DOC 9: name, MRN, age, sex visible on every patient
// screen), contacts and the actions the viewer may take
export function PatientHero({
  patient,
  facts,
  onEdit,
  canChangeStatus,
  extraActions,
}: {
  patient: Patient;
  facts: HeroFact[];
  onEdit?: () => void;
  canChangeStatus: boolean;
  // e.g. "Book appointment" — shown before Edit
  extraActions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { deactivate, reactivate } = useConfirmPatientAction();

  const menu: NonNullable<MenuProps["items"]> = canChangeStatus
    ? [
        patient.isActive
          ? {
              key: "deactivate",
              icon: <StopOutlined />,
              label: t("patients.deactivate"),
              danger: true,
              onClick: () => deactivate(patient),
            }
          : {
              key: "reactivate",
              icon: <UndoOutlined />,
              label: t("patients.reactivate"),
              onClick: () => reactivate(patient),
            },
      ]
    : [];

  return (
    <section className={styles.hero}>
      <div className={styles.heroBand} aria-hidden="true" />
      <div className={styles.heroBody}>
        <div className={styles.heroAvatar}>
          <UserAvatar
            firstName={patient.firstName}
            lastName={patient.lastName}
            size={88}
          />
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroName}>{fullName(patient)}</h1>
          {patient.fatherName && (
            <p className={styles.heroSub}>
              {t("patients.fatherOf", { name: patient.fatherName })}
            </p>
          )}
          <div className={styles.heroTags}>
            <span className={local.mrn}>{patient.mrn}</span>
            <PatientStatusTag isActive={patient.isActive} />
          </div>
          <div className={styles.contacts}>
            <a href={`tel:${patient.phone}`} className={styles.contact}>
              <PhoneOutlined aria-hidden="true" />
              {patient.phone}
            </a>
            {patient.email && (
              <a href={`mailto:${patient.email}`} className={styles.contact}>
                <MailOutlined aria-hidden="true" />
                {patient.email}
              </a>
            )}
          </div>
        </div>
        {(onEdit || menu.length > 0 || extraActions) && (
          <div className={styles.heroActions}>
            {extraActions}
            {onEdit && (
              <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                {t("patients.edit")}
              </Button>
            )}
            {menu.length > 0 && (
              <Dropdown
                menu={{ items: menu }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  icon={<MoreOutlined />}
                  aria-label={t("staffDetail.moreActions")}
                />
              </Dropdown>
            )}
          </div>
        )}
      </div>
      <HeroFacts facts={facts} />
    </section>
  );
}
