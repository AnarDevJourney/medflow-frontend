import type { ReactNode } from "react";
import styles from "./SettingsCard.module.css";

interface SettingsCardProps {
  title: string;
  description?: string;
  footer?: ReactNode; // actions, right aligned
  children: ReactNode;
}

// Titled card with an optional action footer (profile sections)
export function SettingsCard({
  title,
  description,
  footer,
  children,
}: SettingsCardProps) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
