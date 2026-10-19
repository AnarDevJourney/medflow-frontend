import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "@components/ui/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ui/ThemeSwitcher";
import { Sidebar } from "@features/sidebar/components/Sidebar";
import styles from "./AppLayout.module.css";

// Shell of every signed-in page: sidebar + top bar + the page (<Outlet />).
// TODO(F1): user menu, logout, notification bell; global patient search in
// the top bar's left side.
export function AppLayout() {
  return (
    <Layout className={styles.layout}>
      <Sidebar />
      <Layout>
        <Layout.Header className={styles.header}>
          <div />
          <div className={styles.headerRight}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </Layout.Header>
        <Layout.Content className={styles.content}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
