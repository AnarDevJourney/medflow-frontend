import { ReloadOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@store/index";
import styles from "./ServiceBanner.module.css";

// A service did not answer (503 / network). Shown above the page until the
// next successful request; "Try again" refetches what is on screen.
export function ServiceBanner() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const unavailable = useAppSelector((state) => state.ui.serviceUnavailable);
  if (!unavailable) return null;
  return (
    <Alert
      className={styles.banner}
      type="warning"
      showIcon
      title={t("errors.bannerTitle")}
      description={t("errors.bannerText")}
      action={
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => void queryClient.refetchQueries({ type: "active" })}
        >
          {t("table.retry")}
        </Button>
      }
    />
  );
}
