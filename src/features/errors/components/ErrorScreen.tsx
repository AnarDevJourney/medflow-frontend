import type { ReactNode } from "react";
import styles from "./ErrorScreen.module.css";

interface ErrorScreenProps {
  code?: string; // "403", "404" — big and quiet
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  fullPage?: boolean; // outside the app shell (e.g. the API is down before sign-in)
}

// Calm full-width message for 403 / 404 / 5xx with the next step to take
export function ErrorScreen({
  code,
  icon,
  title,
  description,
  actions,
  fullPage,
}: ErrorScreenProps) {
  return (
    <div
      className={[styles.screen, fullPage && styles.fullPage].filter(Boolean).join(" ")}
    >
      {code ? (
        <div className={styles.code} aria-hidden="true">
          {code}
        </div>
      ) : (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
