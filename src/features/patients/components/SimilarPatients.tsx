import { ArrowRightOutlined, WarningOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@hooks/useDebouncedValue";
import { formatDay } from "@lib/dayjs";
import { usePatients } from "../hooks/usePatients";
import type { Patient } from "../services/patientsService";
import { FIN_PATTERN, fullName } from "../utils/patient";
import { PatientStatusTag } from "./PatientStatusTag";
import styles from "./PatientModal.module.css";

// Possible duplicates while registering (DOC 6.1 "search first"): the same
// FIN, or a similar full name. Only a hint — the desk decides.
export function SimilarPatients({
  firstName,
  lastName,
  finCode,
  onOpen,
}: {
  firstName: string;
  lastName: string;
  finCode: string;
  onOpen: (patient: Patient) => void;
}) {
  const { t } = useTranslation();
  const fin = finCode.trim().toUpperCase();
  const name = `${firstName.trim()} ${lastName.trim()}`;
  const term = FIN_PATTERN.test(fin)
    ? fin
    : firstName.trim().length >= 2 && lastName.trim().length >= 2
      ? name
      : "";
  const search = useDebouncedValue(term, 400);
  const matches = usePatients({ page: 1, limit: 5, search }, Boolean(search));
  const items = search ? (matches.data?.items ?? []) : [];

  if (items.length === 0) return null;
  return (
    <section className={styles.similar} aria-live="polite">
      <header className={styles.similarHead}>
        <WarningOutlined aria-hidden="true" />
        <span>
          <strong>{t("patients.similar.title")}</strong>
          <span className={styles.similarHint}>{t("patients.similar.hint")}</span>
        </span>
      </header>
      <ul className={styles.similarList}>
        {items.map((p) => (
          <li key={p.id}>
            <button type="button" className={styles.similarRow} onClick={() => onOpen(p)}>
              <span className={styles.similarName}>{fullName(p)}</span>
              <span className={styles.mrn}>{p.mrn}</span>
              <span className={styles.similarMeta}>{formatDay(p.dateOfBirth)}</span>
              <span className={styles.similarMeta}>{p.phone}</span>
              {!p.isActive && <PatientStatusTag isActive={false} />}
              <span className={styles.similarOpen}>
                {t("patients.similar.open")} <ArrowRightOutlined aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
