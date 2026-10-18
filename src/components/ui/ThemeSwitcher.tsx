import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import type { Theme } from "@lib/theme/constants";
import { useTheme } from "@lib/theme/useTheme";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <Segmented<Theme>
      size="small"
      value={theme}
      onChange={setTheme}
      options={[
        { value: "system", icon: <DesktopOutlined />, title: t("common.theme.system") },
        { value: "light", icon: <SunOutlined />, title: t("common.theme.light") },
        { value: "dark", icon: <MoonOutlined />, title: t("common.theme.dark") },
      ]}
    />
  );
}
