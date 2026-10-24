import { ArrowRightOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
} from "@components/drawer";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime, fromNow } from "@lib/dayjs";
import { useNotificationText } from "../hooks/useNotifications";
import type { NotificationItem } from "../services/notificationsService";
import { NotificationIcon } from "./NotificationIcon";
import { PriorityTag, ReadStatusTag } from "./NotificationTags";
import styles from "./NotificationDrawer.module.css";

const when = (iso: string) => `${formatDateTime(iso)} · ${fromNow(iso)}`;

// One notification in full; "Open" goes to the page it is about
export function NotificationDrawer({
  notification: selected,
  onClose,
}: {
  notification: NotificationItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const text = useNotificationText();
  const n = useLastDefined(selected);
  const { title, message } = n ? text(n) : { title: "", message: "" };

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("notifications.detailsTitle")}
      actions={
        <>
          <Button onClick={onClose}>{t("common.close")}</Button>
          {n?.link && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
              onClick={() => {
                onClose();
                void navigate(n.link!);
              }}
            >
              {t("notifications.openLink")}
            </Button>
          )}
        </>
      }
    >
      {n && (
        <>
          <DetailHeader
            media={<NotificationIcon type={n.type} urgent={n.isUrgent} large />}
            title={title}
            subtitle={when(n.createdAt)}
          />
          <p className={`${styles.message} ${n.isUrgent ? styles.urgent : ""}`}>
            {message}
          </p>
          <DetailSection title={t("notifications.detailsSection")}>
            <DetailList
              items={[
                {
                  label: t("notifications.columns.type"),
                  value: t(`notificationTypes.${n.type}.label`, { defaultValue: title }),
                },
                {
                  label: t("notifications.columns.priority"),
                  value: <PriorityTag urgent={n.isUrgent} />,
                },
                {
                  label: t("notifications.columns.status"),
                  value: <ReadStatusTag read={n.isRead} />,
                },
                { label: t("notifications.columns.createdAt"), value: when(n.createdAt) },
                {
                  label: t("notifications.columns.readAt"),
                  value: n.readAt ? when(n.readAt) : null,
                },
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
