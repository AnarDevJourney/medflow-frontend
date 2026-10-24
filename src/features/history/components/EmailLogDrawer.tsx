import { MailOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
} from "@components/drawer";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime, fromNow } from "@lib/dayjs";
import type { EmailLog, EmailStatus } from "../services/historyService";
import { EmailStatusTag } from "./EmailStatusTag";
import styles from "./History.module.css";

const TONE: Record<EmailStatus, string> = {
  SENT: styles.success,
  QUEUED: styles.system,
  FAILED: styles.danger,
};

const when = (iso: string) => `${formatDateTime(iso)} · ${fromNow(iso)}`;

// One email: who it went to, what it was, and how delivery went.
// No ids (the email and event ids mean nothing to a reader).
export function EmailLogDrawer({
  log: selected,
  onClose,
}: {
  log: EmailLog | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const log = useLastDefined(selected);

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("history.emailDetailsTitle")}
      actions={<Button onClick={onClose}>{t("common.close")}</Button>}
    >
      {log && (
        <>
          <DetailHeader
            media={
              <span
                className={`${styles.eventIcon} ${TONE[log.status]}`}
                aria-hidden="true"
              >
                <MailOutlined />
              </span>
            }
            title={t(`history.emailTemplates.${log.template}`, {
              defaultValue: log.template,
            })}
            subtitle={log.recipientEmail}
            tags={<EmailStatusTag status={log.status} />}
          />

          {log.error && (
            <div className={`${styles.summaryCard} ${styles.danger}`} role="note">
              <div className={styles.cardLabel}>
                {t(
                  log.status === "FAILED" ? "history.failedReason" : "history.lastError",
                )}
              </div>
              {log.error}
            </div>
          )}

          <DetailSection title={t("history.emailSection")}>
            <DetailList
              items={[
                { label: t("history.columns.recipient"), value: log.recipientEmail },
                { label: t("history.columns.subject"), value: log.subject },
              ]}
            />
          </DetailSection>

          <DetailSection title={t("history.deliverySection")}>
            <DetailList
              items={[
                {
                  label: t("staff.columns.status"),
                  value: <EmailStatusTag status={log.status} />,
                },
                { label: t("history.columns.createdAt"), value: when(log.createdAt) },
                {
                  label: t("history.columns.sentAt"),
                  value: log.sentAt ? when(log.sentAt) : null,
                },
                { label: t("history.columns.attempts"), value: log.attempts },
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
