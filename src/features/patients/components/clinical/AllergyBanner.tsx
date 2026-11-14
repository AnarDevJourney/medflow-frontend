import { SafetyCertificateOutlined, WarningFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Allergy } from "../../services/patientsService";
import styles from "./Clinical.module.css";

// DOC 9 clinical safety: the patient's allergies stay visible at the top of
// every patient screen — sticky, never dismissible, most severe first.
// Without any recorded allergy a calm neutral line says so.
export function AllergyBanner({ allergies }: { allergies: Allergy[] }) {
  const { t } = useTranslation();

  if (allergies.length === 0) {
    return (
      <div className={styles.noAllergies} role="note">
        <SafetyCertificateOutlined aria-hidden="true" />
        {t("clinical.banner.none")}
      </div>
    );
  }

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.bannerTitle}>
        <WarningFilled aria-hidden="true" />
        {t("clinical.banner.title", { count: allergies.length })}
      </span>
      <ul className={styles.bannerList}>
        {allergies.map((a) => (
          <li key={a.id} className={styles.chip} data-severity={a.severity}>
            <strong>{a.allergen}</strong>
            <span className={styles.chipSeverity}>
              {t(`clinical.severity.${a.severity}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
