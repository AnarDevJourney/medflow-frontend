import { BellOutlined, SafetyOutlined, WarningFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import styles from "./NotificationIcon.module.css";

const BY_TYPE: Record<string, ReactNode> = {
  SESSION_REVOKED: <SafetyOutlined />,
};

// Round icon per notification type; urgent ones in the warning color
export function NotificationIcon({
  type,
  urgent,
  large,
}: {
  type: string;
  urgent: boolean;
  large?: boolean; // detail drawer header
}) {
  return (
    <span
      className={[styles.icon, urgent && styles.urgent, large && styles.large]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {urgent ? <WarningFilled /> : (BY_TYPE[type] ?? <BellOutlined />)}
    </span>
  );
}
