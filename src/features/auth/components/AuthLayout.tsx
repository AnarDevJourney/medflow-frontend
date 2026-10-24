import {
  BellOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@components/ui/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ui/ThemeSwitcher";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

// Shell of the public pages: brand panel (wide screens) + one focused card
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const features = [
    { key: "feature1", icon: <CalendarOutlined /> },
    { key: "feature2", icon: <BellOutlined /> },
    { key: "feature3", icon: <SafetyCertificateOutlined /> },
  ];

  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        <div className={styles.logo}>
          <MedicineBoxOutlined /> {t("app.name")}
        </div>
        <div className={styles.pitch}>
          <h2 className={styles.headline}>{t("auth.brand.headline")}</h2>
          <p className={styles.lead}>{t("auth.brand.subtitle")}</p>
          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature.key}>
                <span className={styles.featureIcon} aria-hidden="true">
                  {feature.icon}
                </span>
                <div>
                  <div className={styles.featureTitle}>
                    {t(`auth.brand.${feature.key}`)}
                  </div>
                  {t(`auth.brand.${feature.key}Text`)}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.footnote}>© MedFlow</div>
      </aside>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
        <div className={styles.card}>
          <div className={styles.mobileLogo}>
            <MedicineBoxOutlined /> {t("app.name")}
          </div>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
