import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import {
  getTableSettings,
  resetTableSettings,
  updateTableSettings,
  type TableSettings,
  type TableSettingsPatch,
} from "./tableSettingsService";

export const tableSettingsKey = (userId: string | undefined, tableKey: string) =>
  ["configurations", "tables", userId, tableKey] as const;

const defaults = (tableKey: string): TableSettings => ({
  tableKey,
  columns: null,
  density: null,
  view: null,
  updatedAt: null,
});

// Settings of one table: fetched the first time a page with this table
// opens, then kept in the cache for the session. Every change updates the
// cache first (instant UI) and is then written to the DB — same pattern as
// the sidebar settings.
export function useTableSettings(tableKey: string) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const key = tableSettingsKey(userId, tableKey);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getTableSettings(tableKey),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const onError = () => {
    void message.error(t("table.saveError"));
    void queryClient.invalidateQueries({ queryKey: key });
  };
  // One scope per table → its changes reach the server in order
  const scope = { id: `table-settings:${tableKey}` };
  const { mutate: patch } = useMutation({
    mutationFn: (change: TableSettingsPatch) => updateTableSettings(tableKey, change),
    scope,
    onError,
  });
  const { mutate: reset } = useMutation({
    mutationFn: () => resetTableSettings(tableKey),
    scope,
    onError,
  });

  const actions = useMemo(
    () => ({
      update(change: TableSettingsPatch) {
        queryClient.setQueryData<TableSettings>(
          tableSettingsKey(userId, tableKey),
          (old) => ({
            ...(old ?? defaults(tableKey)),
            ...change,
          }),
        );
        patch(change);
      },
      reset() {
        queryClient.setQueryData<TableSettings>(
          tableSettingsKey(userId, tableKey),
          defaults(tableKey),
        );
        reset();
      },
    }),
    [queryClient, userId, tableKey, patch, reset],
  );

  return {
    // Service down → table defaults, the table keeps working
    settings: query.data ?? (query.isError ? defaults(tableKey) : undefined),
    ...actions,
  };
}
