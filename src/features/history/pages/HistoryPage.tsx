import { AuditOutlined, MailOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@components/ui/PageHeader";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { ActionHistoryTab } from "../components/ActionHistoryTab";
import { EmailLogsTab } from "../components/EmailLogsTab";
import styles from "./HistoryPage.module.css";

type Tab = "actions" | "emails";

// Audit: action history (history.read) + email log (emails.read);
// ?tab=emails can be linked to. A tab without its permission is hidden.
export function HistoryPage() {
  const { t } = useTranslation();
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const canActions = can("history.read");
  const canEmails = can("emails.read");
  const tab: Tab =
    !canActions || (canEmails && params.get("tab") === "emails") ? "emails" : "actions";

  return (
    <>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />
      {canActions && canEmails && (
        <Segmented<Tab>
          className={styles.tabs}
          value={tab}
          onChange={(value) =>
            setParams(value === "emails" ? { tab: "emails" } : {}, { replace: true })
          }
          options={[
            { value: "actions", label: t("history.actionsTab"), icon: <AuditOutlined /> },
            { value: "emails", label: t("history.emailsTab"), icon: <MailOutlined /> },
          ]}
        />
      )}
      {tab === "actions" ? <ActionHistoryTab /> : <EmailLogsTab />}
    </>
  );
}
