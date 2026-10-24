import { CloudServerOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { ErrorScreen } from "../components/ErrorScreen";

// Signed-in check failed for another reason than 401 (gateway / auth down)
export function ServerErrorPage({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const message = useErrorMessage();
  return (
    <ErrorScreen
      fullPage
      icon={<CloudServerOutlined />}
      title={t("errors.serverTitle")}
      description={message(error)}
      actions={
        <Button type="primary" onClick={onRetry}>
          {t("table.retry")}
        </Button>
      }
    />
  );
}
