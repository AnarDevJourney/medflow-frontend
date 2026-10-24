import { AuditOutlined, MailOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@components/ui/PageHeader";
import { ActionHistoryTab } from "../components/ActionHistoryTab";
import { EmailLogsTab } from "../components/EmailLogsTab";
import styles from "./HistoryPage.module.css";

type Tab = "actions" | "emails";

// ADMIN audit: action history + email log (?tab=emails can be linked to)
export function HistoryPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "emails" ? "emails" : "actions";

  return (
    <>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />
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
      {tab === "actions" ? <ActionHistoryTab /> : <EmailLogsTab />}
    </>
  );
}
