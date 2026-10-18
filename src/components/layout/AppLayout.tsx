import {
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@components/ui/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ui/ThemeSwitcher";
import { useAppDispatch, useAppSelector } from "@store/index";
import { toggleSidebar } from "@store/uiSlice";
import { NAV_ITEMS } from "./navigation";
import styles from "./AppLayout.module.css";

// Shell of every signed-in page: sidebar + top bar + the page (<Outlet />).
// TODO(F1): filter NAV_ITEMS by the current user's role, user menu, logout,
// notification bell.
export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  const selected = NAV_ITEMS.find((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
  );

  return (
    <Layout className={styles.layout}>
      <Layout.Sider
        className={styles.sider}
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={232}
      >
        <div className={styles.logo}>
          <MedicineBoxOutlined className={styles.logoMark} />
          {!collapsed && t("app.name")}
        </div>
        <Menu
          className={styles.menu}
          mode="inline"
          selectedKeys={selected ? [selected.key] : []}
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: t(item.labelKey),
            onClick: () => navigate(item.path),
          }))}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => dispatch(toggleSidebar())}
          />
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
