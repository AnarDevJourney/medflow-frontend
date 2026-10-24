import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import tagStyles from "@components/ui/Tags.module.css";
import type { EmailStatus } from "../services/historyService";
import styles from "./History.module.css";

const LOOK: Record<EmailStatus, { icon: ReactNode; className: string }> = {
  SENT: { icon: <CheckCircleFilled />, className: tagStyles.success },
  QUEUED: { icon: <ClockCircleFilled />, className: tagStyles.muted },
  FAILED: { icon: <CloseCircleFilled />, className: styles.failed },
};

export function EmailStatusTag({ status }: { status: EmailStatus }) {
  const { t } = useTranslation();
  const { icon, className } = LOOK[status];
  return (
    <span className={`${tagStyles.tag} ${className}`}>
      <span aria-hidden="true">{icon}</span>
      {t(`history.emailStatus.${status}`)}
    </span>
  );
}
