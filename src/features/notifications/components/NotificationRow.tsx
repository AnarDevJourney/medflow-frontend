import { CheckOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateTime, fromNow } from "@lib/dayjs";
import { useNotificationText } from "../hooks/useNotifications";
import type { NotificationItem } from "../services/notificationsService";
import { NotificationIcon } from "./NotificationIcon";
import styles from "./NotificationRow.module.css";

interface NotificationRowProps {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onMarkRead?: (item: NotificationItem) => void;
  compact?: boolean; // bell dropdown
}

// One notification: icon, title, text, time; unread ones are highlighted
// and have a "mark as read" button on hover
export function NotificationRow({
  item,
  onOpen,
  onMarkRead,
  compact,
}: NotificationRowProps) {
  const { t } = useTranslation();
  const { title, message } = useNotificationText()(item);

  return (
    <div
      role="button"
      tabIndex={0}
      className={[styles.row, !item.isRead && styles.unread, compact && styles.compact]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(item);
      }}
    >
      <NotificationIcon type={item.type} urgent={item.isUrgent} />
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {!item.isRead && (
            <span className={styles.dot} aria-label={t("notifications.unread")} />
          )}
        </div>
        <div className={styles.message}>{message}</div>
        <Tooltip title={formatDateTime(item.createdAt)}>
          <time className={styles.time} dateTime={item.createdAt}>
            {fromNow(item.createdAt)}
          </time>
        </Tooltip>
      </div>
      {onMarkRead && !item.isRead && (
        <Tooltip title={t("notifications.markRead")}>
          <Button
            type="text"
            size="small"
            className={styles.markRead}
            icon={<CheckOutlined />}
            aria-label={t("notifications.markRead")}
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(item);
            }}
          />
        </Tooltip>
      )}
    </div>
  );
}
