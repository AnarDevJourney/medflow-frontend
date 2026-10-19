import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Layout, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "@components/ui/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ui/ThemeSwitcher";
import { AppearanceDrawer } from "@features/appearance/components/AppearanceDrawer";
import { Sidebar } from "@features/sidebar/components/Sidebar";
import styles from "./AppLayout.module.css";

// Shell of every signed-in page: sidebar + top bar + the page (<Outlet />).
// TODO(F1): user menu, logout, notification bell; global patient search in
// the top bar's left side.
export function AppLayout() {
  const { t } = useTranslation();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  return (
    <Layout className={styles.layout}>
      <Sidebar />
      <Layout>
        <Layout.Header className={styles.header}>
          <div />
          <div className={styles.headerRight}>
            <ThemeSwitcher />
            <Tooltip title={t("appearance.title")}>
              <Button
                type="text"
                icon={<BgColorsOutlined />}
                aria-label={t("appearance.title")}
                onClick={() => setAppearanceOpen(true)}
              />
            </Tooltip>
            <LanguageSwitcher />
          </div>
        </Layout.Header>
        <Layout.Content className={styles.content}>
          <Outlet />
        </Layout.Content>
      </Layout>
      <AppearanceDrawer open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </Layout>
  );
}
