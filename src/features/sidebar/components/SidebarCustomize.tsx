import {
  BulbOutlined,
  ClearOutlined,
  FolderAddOutlined,
  PicLeftOutlined,
  PicRightOutlined,
  SettingOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App, Button, Popover, Segmented, Switch, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SidebarPosition } from "../services/sidebarSettingsService";
import styles from "./Sidebar.module.css";

interface SidebarCustomizeProps {
  collapsed: boolean;
  position: SidebarPosition;
  showFrequent: boolean;
  showRecent: boolean;
  onShowFrequent: (value: boolean) => void;
  onShowRecent: (value: boolean) => void;
  onPosition: (value: SidebarPosition) => void;
  onNewGroup: () => void;
  onClearHistory: () => void;
  onReset: () => void;
}

// Footer button → small panel with the sidebar's options
export function SidebarCustomize({
  collapsed,
  position,
  showFrequent,
  showRecent,
  onShowFrequent,
  onShowRecent,
  onPosition,
  onNewGroup,
  onClearHistory,
  onReset,
}: SidebarCustomizeProps) {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const confirmReset = () =>
    modal.confirm({
      title: t("sidebar.resetConfirmTitle"),
      content: t("sidebar.resetConfirmBody"),
      okText: t("sidebar.reset"),
      cancelText: t("common.cancel"),
      onOk: onReset,
    });

  const panel = (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>{t("sidebar.customize")}</div>
      <div className={styles.panelField}>
        <span id="sidebar-position-label">{t("sidebar.position")}</span>
        <Segmented<SidebarPosition>
          block
          size="small"
          aria-labelledby="sidebar-position-label"
          value={position}
          onChange={onPosition}
          options={[
            { value: "left", label: t("sidebar.left"), icon: <PicLeftOutlined /> },
            { value: "right", label: t("sidebar.right"), icon: <PicRightOutlined /> },
          ]}
        />
      </div>
      <label className={styles.panelRow}>
        {t("sidebar.showFrequent")}
        <Switch size="small" checked={showFrequent} onChange={onShowFrequent} />
      </label>
      <label className={styles.panelRow}>
        {t("sidebar.showRecent")}
        <Switch size="small" checked={showRecent} onChange={onShowRecent} />
      </label>
      <div className={styles.panelDivider} />
      <Button
        type="text"
        block
        className={styles.panelAction}
        icon={<FolderAddOutlined />}
        onClick={run(onNewGroup)}
      >
        {t("sidebar.newGroup")}
      </Button>
      <Button
        type="text"
        block
        className={styles.panelAction}
        icon={<ClearOutlined />}
        onClick={run(onClearHistory)}
      >
        {t("sidebar.clearHistory")}
      </Button>
      <Button
        type="text"
        block
        className={styles.panelAction}
        icon={<UndoOutlined />}
        onClick={run(confirmReset)}
      >
        {t("sidebar.reset")}
      </Button>
      <div className={styles.panelDivider} />
      <div className={styles.panelHint}>
        <BulbOutlined />
        <span>{t("sidebar.hint")}</span>
      </div>
    </div>
  );

  const trigger = (
    <Button
      type="text"
      icon={<SettingOutlined />}
      className={styles.footerMain}
      aria-label={collapsed ? t("sidebar.customize") : undefined}
    >
      {!collapsed && t("sidebar.customize")}
    </Button>
  );

  return (
    <Popover
      content={panel}
      trigger="click"
      placement={
        position === "right"
          ? collapsed
            ? "leftBottom"
            : "topRight"
          : collapsed
            ? "rightBottom"
            : "topLeft"
      }
      open={open}
      onOpenChange={setOpen}
      arrow={false}
    >
      {collapsed ? (
        <Tooltip
          title={t("sidebar.customize")}
          placement={position === "right" ? "left" : "right"}
        >
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
    </Popover>
  );
}
