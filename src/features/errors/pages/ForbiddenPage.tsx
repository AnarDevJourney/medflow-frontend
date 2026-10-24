import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PATHS } from "@router/paths";
import { ErrorScreen } from "../components/ErrorScreen";

// The page exists but not for this role
export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      code="403"
      title={t("errors.forbiddenTitle")}
      description={t("errors.forbiddenText")}
      actions={
        <Link to={PATHS.home}>
          <Button type="primary">{t("common.backHome")}</Button>
        </Link>
      }
    />
  );
}
