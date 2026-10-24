import { InboxOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode; // the next step the user can take
  icon?: ReactNode;
  compact?: boolean; // inside dropdowns / small cards
}

// Explains what is missing and offers the next action
export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
}: EmptyStateProps) {
  return (
    <div className={[styles.empty, compact && styles.compact].filter(Boolean).join(" ")}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <InboxOutlined />}
      </span>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
