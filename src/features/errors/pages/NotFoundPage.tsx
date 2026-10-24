import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PATHS } from "@router/paths";
import { ErrorScreen } from "../components/ErrorScreen";

export function NotFoundPage({ fullPage = false }: { fullPage?: boolean }) {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      fullPage={fullPage}
      code="404"
      title={t("errors.notFound")}
      description={t("errors.notFoundText")}
      actions={
        <Link to={PATHS.home}>
          <Button type="primary">{t("common.backHome")}</Button>
        </Link>
      }
    />
  );
}
