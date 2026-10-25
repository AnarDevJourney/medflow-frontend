import { App } from "antd";
import { useCallback, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TableSyncProvider, TABLE_VIEWS, type TableSyncLabels } from "tablesync";
import { tableSettingsStorage } from "./tableSettingsStorage";
import "tablesync/styles.css";
import "./tablesyncTheme.css";

const TOP_BAR_HEIGHT = 64;

// tablesync wired to MedFlow: settings in configurations-service, texts
// from i18n (`table.*`), errors as a toast. Lives in AppLayout, so every
// sign-in starts with a fresh cache.
export function MedflowTableSync({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const labels = useMemo<TableSyncLabels>(
    () => ({
      actions: t("table.actions"),
      rowActions: t("table.rowActions"),
      rowActionsFor: (name) => t("table.rowActionsFor", { name }),
      viewDetails: t("table.viewDetails"),
      settings: t("table.settings"),
      view: t("table.view"),
      density: t("table.density"),
      compact: t("table.compact"),
      comfortable: t("table.comfortable"),
      columns: t("table.columns"),
      visibleCount: (visible, total) => t("table.visibleCount", { visible, total }),
      columnsHint: t("table.columnsHint"),
      pinnedLeft: t("table.pinnedLeft"),
      pinnedRight: t("table.pinnedRight"),
      notPinned: t("table.notPinned"),
      pinLeft: t("table.pinLeft"),
      pinRight: t("table.pinRight"),
      unpin: t("table.unpin"),
      showAll: t("table.showAll"),
      resetWidth: t("table.resetWidth"),
      alwaysVisible: t("table.alwaysVisible"),
      dragColumn: (name) => t("table.dragColumn", { name }),
      resizeColumn: (name) => t("table.resizeColumn", { name }),
      reset: t("table.reset"),
      resetConfirmTitle: t("table.resetConfirmTitle"),
      resetConfirmBody: t("table.resetConfirmBody"),
      cancel: t("common.cancel"),
      done: t("table.done"),
      emptyTitle: t("table.emptyTitle"),
      emptyText: t("table.emptyText"),
      errorTitle: t("table.errorTitle"),
      retry: t("table.retry"),
      total: (from, to, total) => t("table.total", { from, to, total }),
      views: Object.fromEntries(
        TABLE_VIEWS.map((id) => [
          id,
          { name: t(`table.views.${id}.name`), desc: t(`table.views.${id}.desc`) },
        ]),
      ) as TableSyncLabels["views"],
    }),
    // react-i18next hands out a new `t` on every language change
    [t],
  );

  const onSaveError = useCallback(
    () => void message.error(t("table.saveError")),
    [message, t],
  );

  return (
    <TableSyncProvider
      storage={tableSettingsStorage}
      labels={labels}
      onSaveError={onSaveError}
      stickyOffset={TOP_BAR_HEIGHT}
    >
      {children}
    </TableSyncProvider>
  );
}
