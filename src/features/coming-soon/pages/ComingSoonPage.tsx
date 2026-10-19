import { ToolOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { findNavItem } from "@components/layout/navigation";
import { PATHS } from "@router/paths";

// Placeholder for pages of later phases, so every sidebar entry already
// leads somewhere
export function ComingSoonPage() {
  const { t } = useTranslation();
  const item = findNavItem(useLocation().pathname);
  return (
    <Result
      // Calm muted icon instead of AntD's default info blue
      icon={<ToolOutlined style={{ color: "var(--color-muted)" }} />}
      title={item ? t(item.labelKey) : t("common.comingSoon")}
      subTitle={t("common.comingSoonText")}
      extra={
        <Link to={PATHS.home}>
          <Button>{t("common.backHome")}</Button>
        </Link>
      }
    />
  );
}
