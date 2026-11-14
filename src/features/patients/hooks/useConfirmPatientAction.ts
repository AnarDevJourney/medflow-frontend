import { App } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import type { Patient } from "../services/patientsService";
import { fullName } from "../utils/patient";
import { usePatientActions } from "./usePatients";

// Deactivate / reactivate with a confirmation that states the consequence.
// Stable between renders, so memoized table columns are not rebuilt.
export function useConfirmPatientAction() {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { mutateAsync: setActive } = usePatientActions().setActive;

  return useMemo(() => {
    const run = (patient: Patient, isActive: boolean, doneKey: string) =>
      setActive({ id: patient.id, isActive }).then(
        () => void message.success(t(doneKey, { name: fullName(patient) })),
        (error: unknown) => void message.error(errorMessage(error)),
      );

    return {
      deactivate: (patient: Patient) =>
        modal.confirm({
          title: t("patients.deactivateTitle", {
            name: fullName(patient),
            mrn: patient.mrn,
          }),
          content: t("patients.deactivateText"),
          okText: t("patients.deactivate"),
          okButtonProps: { danger: true },
          cancelText: t("common.cancel"),
          onOk: () => run(patient, false, "patients.deactivated"),
        }),
      reactivate: (patient: Patient) =>
        modal.confirm({
          title: t("patients.reactivateTitle", {
            name: fullName(patient),
            mrn: patient.mrn,
          }),
          content: t("patients.reactivateText"),
          okText: t("patients.reactivate"),
          cancelText: t("common.cancel"),
          onOk: () => run(patient, true, "patients.reactivated"),
        }),
    };
  }, [t, modal, message, errorMessage, setActive]);
}
