import { ArrowRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { NAV_ITEMS } from "@components/layout/navigation";
import { RoleTag } from "@components/ui/RoleTag";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { toClinicTime } from "@lib/dayjs";
import styles from "./DashboardPage.module.css";

// Clinic time of day → greeting
const greetingKey = (hour: number) =>
  hour < 5 ? "evening" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

// Role-shaped home page (DOC 9.2). The role widgets (today's queue,
// revenue, lab orders …) arrive with their backend phases; for now: a
// welcome and quick access to this role's pages.
export function DashboardPage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  if (!user) return null;

  const now = toClinicTime(new Date());
  const pages = NAV_ITEMS.filter(
    (item) => item.key !== "dashboard" && item.roles.includes(user.role),
  );

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div>
          <p className={styles.date}>{now.format("dddd, D MMMM YYYY")}</p>
          <h1 className={styles.greeting}>
            {t(`dashboard.greeting.${greetingKey(now.hour())}`, { name: user.firstName })}
          </h1>
          <p className={styles.lead}>{t("dashboard.lead")}</p>
        </div>
        <RoleTag role={user.role} />
      </section>

      <section>
        <h2 className={styles.heading}>{t("dashboard.quickAccess")}</h2>
        <div className={styles.tiles}>
          {pages.map((item) => (
            <Link key={item.key} to={item.path} className={styles.tile}>
              <span className={styles.tileIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.tileLabel}>{t(item.labelKey)}</span>
              <ArrowRightOutlined className={styles.tileArrow} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
