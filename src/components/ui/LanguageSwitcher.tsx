import { GlobalOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "@lib/i18n";

const LABELS: Record<SupportedLanguage, string> = { az: "AZ", en: "EN", ru: "RU" };

// Compact language picker for the top bar / auth pages: globe + code
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  return (
    <Select
      aria-label={t("common.language")}
      variant="borderless"
      prefix={<GlobalOutlined />}
      suffixIcon={null}
      popupMatchSelectWidth={false}
      value={i18n.resolvedLanguage as SupportedLanguage}
      onChange={(lng) => void i18n.changeLanguage(lng)}
      options={supportedLanguages.map((lng) => ({ value: lng, label: LABELS[lng] }))}
    />
  );
}
