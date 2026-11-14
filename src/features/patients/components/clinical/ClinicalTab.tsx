import {
  AlertOutlined,
  DeleteOutlined,
  EditOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { App, Button, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InfoCard } from "@components/detail-page";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { formatDate, formatDay } from "@lib/dayjs";
import { useClinicalActions } from "../../hooks/usePatients";
import type { Allergy, Condition, Patient } from "../../services/patientsService";
import { fullName } from "../../utils/patient";
import { AllergyModal } from "./AllergyModal";
import { AllergySeverityTag, ConditionStatusTag } from "./ClinicalTags";
import { ConditionModal } from "./ConditionModal";
import styles from "./Clinical.module.css";

// Allergies and chronic conditions (patients.clinical_read); adding,
// updating and removing need patients.clinical_manage and an active record.
export function ClinicalTab({
  patient,
  canManage,
}: {
  patient: Patient;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { removeAllergy, removeCondition } = useClinicalActions(patient.id);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [editing, setEditing] = useState<Condition | null>(null);
  const manage = canManage && patient.isActive;
  const allergies = patient.allergies ?? [];
  const conditions = patient.conditions ?? [];
  const label = `${fullName(patient)} · ${patient.mrn}`;
  const recorded = (item: { recordedByName: string | null; createdAt: string }) =>
    [item.recordedByName, formatDate(item.createdAt)].filter(Boolean).join(" · ");

  // Clinical-risk actions state their consequence (DOC 9)
  const confirmRemoveAllergy = (a: Allergy) =>
    modal.confirm({
      title: t("clinical.removeAllergyTitle", { name: a.allergen }),
      content: t("clinical.removeAllergyText"),
      okText: t("clinical.remove"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () =>
        removeAllergy.mutateAsync(a.id).then(
          () => void message.success(t("clinical.allergyRemoved", { name: a.allergen })),
          (error: unknown) => void message.error(errorMessage(error)),
        ),
    });
  const confirmRemoveCondition = (c: Condition) =>
    modal.confirm({
      title: t("clinical.removeConditionTitle", { name: c.name }),
      content: t("clinical.removeConditionText"),
      okText: t("clinical.remove"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () =>
        removeCondition.mutateAsync(c.id).then(
          () => void message.success(t("clinical.conditionRemoved", { name: c.name })),
          (error: unknown) => void message.error(errorMessage(error)),
        ),
    });

  const addButton = (onClick: () => void) =>
    manage && (
      <Button size="small" icon={<PlusOutlined />} onClick={onClick}>
        {t("clinical.add")}
      </Button>
    );

  return (
    <div className={styles.grid}>
      <InfoCard
        icon={<AlertOutlined />}
        title={t("clinical.allergies")}
        action={addButton(() => setAllergyOpen(true))}
      >
        {allergies.length === 0 ? (
          <p className={styles.empty}>{t("clinical.noAllergies")}</p>
        ) : (
          <ul className={styles.list}>
            {allergies.map((a) => (
              <li key={a.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemName}>{a.allergen}</span>
                    <AllergySeverityTag severity={a.severity} />
                  </div>
                  <span className={styles.itemText}>
                    {t(`clinical.category.${a.category}`)}
                    {a.reaction && ` · ${a.reaction}`}
                  </span>
                  <span className={styles.itemMeta}>{recorded(a)}</span>
                </div>
                {manage && (
                  <div className={styles.itemActions}>
                    <Tooltip title={t("clinical.edit")}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        aria-label={`${t("clinical.edit")}: ${a.allergen}`}
                        onClick={() => {
                          setEditingAllergy(a);
                          setAllergyOpen(true);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t("clinical.remove")}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`${t("clinical.remove")}: ${a.allergen}`}
                        onClick={() => confirmRemoveAllergy(a)}
                      />
                    </Tooltip>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <InfoCard
        icon={<MedicineBoxOutlined />}
        title={t("clinical.conditions")}
        action={addButton(() => setConditionOpen(true))}
      >
        {conditions.length === 0 ? (
          <p className={styles.empty}>{t("clinical.noConditions")}</p>
        ) : (
          <ul className={styles.list}>
            {conditions.map((c) => (
              <li
                key={c.id}
                className={`${styles.item} ${c.status === "RESOLVED" ? styles.resolved : ""}`}
              >
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemName}>{c.name}</span>
                    {c.icd10Code && <span className={styles.code}>{c.icd10Code}</span>}
                    <ConditionStatusTag status={c.status} />
                  </div>
                  {c.diagnosedOn && (
                    <span className={styles.itemText}>
                      {t("clinical.diagnosedOn", { date: formatDay(c.diagnosedOn) })}
                    </span>
                  )}
                  {c.notes && <span className={styles.itemText}>{c.notes}</span>}
                  <span className={styles.itemMeta}>{recorded(c)}</span>
                </div>
                {manage && (
                  <div className={styles.itemActions}>
                    <Tooltip title={t("clinical.edit")}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        aria-label={`${t("clinical.edit")}: ${c.name}`}
                        onClick={() => {
                          setEditing(c);
                          setConditionOpen(true);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t("clinical.remove")}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`${t("clinical.remove")}: ${c.name}`}
                        onClick={() => confirmRemoveCondition(c)}
                      />
                    </Tooltip>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <AllergyModal
        open={allergyOpen}
        patientId={patient.id}
        patientLabel={label}
        allergy={editingAllergy}
        onClose={() => {
          setAllergyOpen(false);
          setEditingAllergy(null);
        }}
      />
      <ConditionModal
        open={conditionOpen}
        patientId={patient.id}
        patientLabel={label}
        condition={editing}
        onClose={() => {
          setConditionOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
