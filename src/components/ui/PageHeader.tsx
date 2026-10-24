import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode; // primary action(s) on the right
}

// Title row of every page: same rhythm everywhere (title → filters/actions → content)
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
