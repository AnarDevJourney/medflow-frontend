import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppearanceDrawer } from "@features/appearance/components/AppearanceDrawer";
import { supportedLanguages, type SupportedLanguage } from "@lib/i18n";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

// Native names: everyone finds their own language
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  az: "Azərbaycan dili",
  en: "English",
  ru: "Русский",
};

export function PreferencesCard() {
  const { t, i18n } = useTranslation();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  return (
    <SettingsCard title={t("profile.preferencesTitle")}>
      <div className={styles.preference}>
        <div className={styles.preferenceText}>
          <span className={styles.preferenceTitle}>{t("common.language")}</span>
          <span className={styles.preferenceHint}>{t("profile.languageHint")}</span>
        </div>
        <Select<SupportedLanguage>
          value={i18n.resolvedLanguage as SupportedLanguage}
          onChange={(lng) => void i18n.changeLanguage(lng)}
          options={supportedLanguages.map((lng) => ({
            value: lng,
            label: LANGUAGE_NAMES[lng],
          }))}
          style={{ minWidth: 200 }}
          aria-label={t("common.language")}
        />
      </div>
      <div className={styles.preference}>
        <div className={styles.preferenceText}>
          <span className={styles.preferenceTitle}>{t("appearance.title")}</span>
          <span className={styles.preferenceHint}>{t("profile.appearanceHint")}</span>
        </div>
        <Button icon={<BgColorsOutlined />} onClick={() => setAppearanceOpen(true)}>
          {t("profile.customizeAppearance")}
        </Button>
      </div>
      <AppearanceDrawer open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </SettingsCard>
  );
}
