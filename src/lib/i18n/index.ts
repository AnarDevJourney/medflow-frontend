import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import dayjs from "@lib/dayjs";
import az from "./locales/az.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

export const supportedLanguages = ["az", "en", "ru"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const syncDayjsLocale = (lng: string) => {
  dayjs.locale(supportedLanguages.includes(lng as SupportedLanguage) ? lng : "en");
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      az: { translation: az },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "medflow-language",
    },
  });

// "5 minutes ago" etc. follow the app language
syncDayjsLocale(i18n.language);
i18n.on("languageChanged", syncDayjsLocale);

export default i18n;
