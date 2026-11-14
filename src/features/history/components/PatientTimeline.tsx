import { useTranslation } from "react-i18next";
import { listPatientHistory } from "../services/historyService";
import { HistoryTimeline } from "./HistoryTimeline";

// Everything recorded about one patient (history.patient_read). Later
// phases add appointments, visits, lab orders and invoices to the same feed.
export function PatientTimeline({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  return (
    <HistoryTimeline
      queryKey={["patient", patientId]}
      fetchPage={(page, limit) => listPatientHistory(patientId, { page, limit })}
      title={t("patientDetail.history.title")}
      hint={t("patientDetail.history.hint")}
      emptyTitle={t("patientDetail.history.empty")}
    />
  );
}
