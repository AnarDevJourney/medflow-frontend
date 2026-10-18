import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PATHS } from "@router/paths";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Result
      status="404"
      title="404"
      subTitle={t("errors.notFound")}
      extra={
        <Link to={PATHS.home}>
          <Button type="primary">{t("common.backHome")}</Button>
        </Link>
      }
    />
  );
}
