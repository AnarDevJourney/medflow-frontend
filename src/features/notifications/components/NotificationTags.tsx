import { CheckCircleFilled, MinusCircleOutlined, WarningFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import tagStyles from "@components/ui/Tags.module.css";
import styles from "./NotificationTags.module.css";

// Read / unread: icon + text + color (never color alone)
export function ReadStatusTag({ read }: { read: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={`${tagStyles.tag} ${read ? tagStyles.muted : styles.unread}`}>
      <span aria-hidden="true">
        {read ? <CheckCircleFilled /> : <span className={styles.dot} />}
      </span>
      {t(read ? "notifications.read" : "notifications.unread")}
    </span>
  );
}

export function PriorityTag({ urgent }: { urgent: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={`${tagStyles.tag} ${urgent ? tagStyles.warning : tagStyles.muted}`}>
      <span aria-hidden="true">
        {urgent ? <WarningFilled /> : <MinusCircleOutlined />}
      </span>
      {t(urgent ? "notifications.urgent" : "notifications.normal")}
    </span>
  );
}
