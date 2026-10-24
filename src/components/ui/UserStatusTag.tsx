import { CheckCircleFilled, ClockCircleFilled, StopFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { UserStatus } from "@models/enums";
import styles from "./Tags.module.css";

const LOOK: Record<UserStatus, { icon: ReactNode; className: string }> = {
  ACTIVE: { icon: <CheckCircleFilled />, className: styles.success },
  INVITED: { icon: <ClockCircleFilled />, className: styles.warning },
  DEACTIVATED: { icon: <StopFilled />, className: styles.muted },
};

// Account status: icon + text + semantic color (never color alone)
export function UserStatusTag({ status }: { status: UserStatus }) {
  const { t } = useTranslation();
  const { icon, className } = LOOK[status];
  return (
    <span className={`${styles.tag} ${className}`}>
      <span aria-hidden="true">{icon}</span>
      {t(`userStatus.${status}`)}
    </span>
  );
}
