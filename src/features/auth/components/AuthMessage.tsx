import type { ReactNode } from "react";
import styles from "./AuthMessage.module.css";

interface AuthMessageProps {
  icon: ReactNode;
  tone?: "success" | "warning" | "error" | "info";
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

// Result screen inside the auth card (link expired, email sent, done …)
export function AuthMessage({
  icon,
  tone = "info",
  title,
  description,
  actions,
}: AuthMessageProps) {
  return (
    <div className={styles.message} role={tone === "error" ? "alert" : "status"}>
      <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
        {icon}
      </span>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
