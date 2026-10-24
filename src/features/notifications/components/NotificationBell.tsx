import { BellOutlined } from "@ant-design/icons";
import { Badge, Button, Popover, Skeleton, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@components/ui/EmptyState";
import { PATHS } from "@router/paths";
import { useAppSelector } from "@store/index";
import {
  useMarkRead,
  useNotificationsList,
  useOpenNotification,
} from "../hooks/useNotifications";
import { NotificationRow } from "./NotificationRow";
import styles from "./NotificationBell.module.css";

const LATEST = { page: 1, limit: 10 };

// Top-bar bell: live unread badge (socket) + the latest 10 in a popover
export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const unread = useAppSelector((state) => state.ui.unreadCount) ?? 0;
  const latest = useNotificationsList(LATEST, open);
  const { read, readAll } = useMarkRead();
  const openNotification = useOpenNotification();

  const content = (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{t("notifications.title")}</span>
        <Button
          type="link"
          size="small"
          disabled={unread === 0}
          loading={readAll.isPending}
          onClick={() => readAll.mutate()}
        >
          {t("notifications.markAllRead")}
        </Button>
      </div>
      <div className={styles.list}>
        {latest.isPending ? (
          <div className={styles.loading}>
            <Skeleton active avatar paragraph={{ rows: 1 }} />
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          </div>
        ) : latest.data?.items.length ? (
          latest.data.items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              compact
              onOpen={(n) => {
                setOpen(false);
                openNotification(n);
              }}
              onMarkRead={(n) => read.mutate(n.id)}
            />
          ))
        ) : (
          <EmptyState
            compact
            title={t("notifications.emptyTitle")}
            description={t("notifications.emptyText")}
          />
        )}
      </div>
      <Link
        to={PATHS.notifications}
        className={styles.footer}
        onClick={() => setOpen(false)}
      >
        {t("notifications.viewAll")}
      </Link>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip title={open ? undefined : t("notifications.title")}>
        <Button
          type="text"
          aria-label={t("notifications.bellLabel", { count: unread })}
          icon={
            <Badge count={unread} size="small" overflowCount={99} offset={[2, -2]}>
              <BellOutlined className={styles.bell} />
            </Badge>
          }
        />
      </Tooltip>
    </Popover>
  );
}
