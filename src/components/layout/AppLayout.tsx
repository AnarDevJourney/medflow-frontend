import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Divider, Layout, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { MedflowTableSync } from "@components/data-table";
import { LanguageSwitcher } from "@components/ui/LanguageSwitcher";
import { AppearanceDrawer } from "@features/appearance/components/AppearanceDrawer";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { NotificationBell } from "@features/notifications/components/NotificationBell";
import { useNotificationSocket } from "@features/notifications/hooks/useNotificationSocket";
import { Sidebar } from "@features/sidebar/components/Sidebar";
import { ServiceBanner } from "./ServiceBanner";
import { UserMenu } from "./UserMenu";
import styles from "./AppLayout.module.css";

// Shell of every signed-in page (inside RequireAuth): sidebar, top bar
// (appearance, language, notifications, account) and the page.
// TODO(command palette): global patient search on the left of the top bar.
export function AppLayout() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  useNotificationSocket();

  return (
    <Layout className={styles.layout}>
      <Sidebar />
      <Layout>
        <Layout.Header className={styles.header}>
          <div />
          <div className={styles.headerRight}>
            <Tooltip title={t("appearance.title")}>
              <Button
                type="text"
                icon={<BgColorsOutlined />}
                aria-label={t("appearance.title")}
                onClick={() => setAppearanceOpen(true)}
              />
            </Tooltip>
            <LanguageSwitcher />
            <NotificationBell />
            <Divider orientation="vertical" className={styles.divider} />
            {user && (
              <UserMenu user={user} onAppearance={() => setAppearanceOpen(true)} />
            )}
          </div>
        </Layout.Header>
        <Layout.Content className={styles.content}>
          <ServiceBanner />
          <MedflowTableSync>
            <Outlet />
          </MedflowTableSync>
        </Layout.Content>
      </Layout>
      <AppearanceDrawer open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </Layout>
  );
}
