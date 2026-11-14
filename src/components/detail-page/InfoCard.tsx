import type { ReactNode } from "react";
import styles from "./DetailPage.module.css";

// A titled card on a detail page (staff, patient)
export function InfoCard({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon} aria-hidden="true">
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
