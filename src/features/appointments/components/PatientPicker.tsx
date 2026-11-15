import { Select, Spin } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@hooks/useDebouncedValue";
import { formatDay } from "@lib/dayjs";
import { usePatients } from "@features/patients/hooks/usePatients";
import { fullName } from "@features/patients/utils/patient";
import styles from "./BookAppointmentModal.module.css";

// What the booking form keeps of the chosen patient
export interface PatientRef {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
  phone: string;
  dateOfBirth: string;
}

// Active patients by name (typos allowed), MRN, FIN or phone — the same
// search as the registry
export function PatientPicker({
  id,
  value,
  onChange,
  status,
}: {
  id?: string;
  value: PatientRef | null;
  onChange: (patient: PatientRef | null) => void;
  status?: "error";
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const search = useDebouncedValue(text.trim(), 300);
  const matches = usePatients(
    { page: 1, limit: 8, search, isActive: true },
    search.length >= 2,
  );
  const items = search.length >= 2 ? (matches.data?.items ?? []) : [];
  // The chosen patient stays an option while a new search is typed
  const options = [
    ...(value && !items.some((p) => p.id === value.id) ? [value] : []),
    ...items,
  ].map((p) => ({
    value: p.id,
    label: fullName(p),
    patient: p,
  }));

  return (
    <Select<string, (typeof options)[number]>
      id={id}
      showSearch={{ filterOption: false, onSearch: setText }}
      allowClear
      status={status}
      placeholder={t("appointments.book.patientPlaceholder")}
      value={value?.id}
      onChange={(_, option) => {
        const picked = Array.isArray(option) ? option[0] : option;
        onChange(
          picked
            ? {
                id: picked.patient.id,
                firstName: picked.patient.firstName,
                lastName: picked.patient.lastName,
                mrn: picked.patient.mrn,
                phone: picked.patient.phone,
                dateOfBirth: picked.patient.dateOfBirth,
              }
            : null,
        );
        setText("");
      }}
      options={options}
      optionRender={(option) => (
        <span className={styles.patientOption}>
          <span className={styles.patientOptionName}>{option.label}</span>
          <span className={styles.mrn}>{option.data.patient.mrn}</span>
          <span className={styles.patientOptionMeta}>
            {formatDay(option.data.patient.dateOfBirth)} · {option.data.patient.phone}
          </span>
        </span>
      )}
      notFoundContent={
        search.length < 2 ? (
          <span className={styles.pickerHint}>{t("appointments.book.patientHint")}</span>
        ) : matches.isFetching ? (
          <Spin size="small" />
        ) : (
          <span className={styles.pickerHint}>{t("appointments.book.patientNone")}</span>
        )
      }
      className={styles.full}
    />
  );
}
