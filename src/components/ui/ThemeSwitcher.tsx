import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import { useAppearanceActions } from "@features/appearance/hooks/useAppearanceActions";
import type { Theme } from "@lib/theme/constants";
import { useTheme } from "@lib/theme/useTheme";

// Quick light / dark / system toggle in the top bar (saved like every
// other appearance setting)
export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { appearance } = useTheme();
  const { update } = useAppearanceActions();
  return (
    <Segmented<Theme>
      size="small"
      value={appearance.mode}
      onChange={(mode) => update({ mode })}
      options={[
        { value: "system", icon: <DesktopOutlined />, title: t("common.theme.system") },
        { value: "light", icon: <SunOutlined />, title: t("common.theme.light") },
        { value: "dark", icon: <MoonOutlined />, title: t("common.theme.dark") },
      ]}
    />
  );
}
