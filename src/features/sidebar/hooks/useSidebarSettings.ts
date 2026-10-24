import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  clearPageVisits,
  getSidebarSettings,
  recordPageVisit,
  updateSidebarSettings,
  type SidebarSettings,
  type SidebarSettingsPatch,
} from "../services/sidebarSettingsService";

// Same as the backend defaults (user without a saved row)
export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  collapsed: false,
  position: "left",
  groups: null,
  favorites: [],
  showFrequent: true,
  showRecent: true,
  pageVisits: {},
  updatedAt: null,
};

export const sidebarSettingsKey = (userId: string | undefined) =>
  ["configurations", "sidebar", userId] as const;

// Last known settings per user and browser: the sidebar renders them at once
// on the next page load while the real ones are fetched (no skeleton flash,
// no width jump when the user keeps the sidebar collapsed)
const snapshotKey = (userId: string) => `medflow-sidebar:${userId}`;

function readSnapshot(userId: string | undefined): SidebarSettings | undefined {
  if (!userId) return undefined;
  try {
    const raw = localStorage.getItem(snapshotKey(userId));
    return raw ? { ...DEFAULT_SIDEBAR_SETTINGS, ...JSON.parse(raw) } : undefined;
  } catch {
    return undefined;
  }
}

function writeSnapshot(userId: string, settings: SidebarSettings) {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(settings));
  } catch {
    // storage full or blocked — the snapshot is only a convenience
  }
}

// Fetched once per session and kept in the cache; every change updates the
// cache first (instant UI) and is then written to the DB.
export function useSidebarSettings(userId: string | undefined) {
  const query = useQuery({
    queryKey: sidebarSettingsKey(userId),
    queryFn: getSidebarSettings,
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: () => readSnapshot(userId),
  });

  useEffect(() => {
    if (userId && query.data && !query.isPlaceholderData)
      writeSnapshot(userId, query.data);
  }, [userId, query.data, query.isPlaceholderData]);

  return {
    // Service down → defaults, the sidebar keeps working
    settings: query.data ?? (query.isError ? DEFAULT_SIDEBAR_SETTINGS : undefined),
    // Real data (or the defaults after an error), not the local snapshot
    isReady: (query.isSuccess && !query.isPlaceholderData) || query.isError,
  };
}

export function useSidebarSettingsActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const setCached = useCallback(
    (change: (current: SidebarSettings) => Partial<SidebarSettings>) =>
      queryClient.setQueryData<SidebarSettings>(sidebarSettingsKey(userId), (old) => {
        const current = old ?? DEFAULT_SIDEBAR_SETTINGS;
        return { ...current, ...change(current) };
      }),
    [queryClient, userId],
  );

  const onError = useCallback(() => {
    void message.error(t("sidebar.saveError"));
    // Back to what the server really has
    void queryClient.invalidateQueries({ queryKey: sidebarSettingsKey(userId) });
  }, [message, t, queryClient, userId]);

  // One scope → changes reach the server one after another, in order
  const { mutate: patch } = useMutation({
    mutationFn: updateSidebarSettings,
    scope: { id: "sidebar-settings" },
    onError,
  });
  const { mutate: clear } = useMutation({
    mutationFn: clearPageVisits,
    scope: { id: "sidebar-settings" },
    onError,
  });
  // A lost visit is not worth bothering the user about
  const { mutate: visit } = useMutation({ mutationFn: recordPageVisit });

  return useMemo(
    () => ({
      update(change: SidebarSettingsPatch) {
        setCached(() => change);
        patch(change);
      },
      recordVisit(pageKey: string) {
        setCached(({ pageVisits }) => ({
          pageVisits: {
            ...pageVisits,
            [pageKey]: {
              count: (pageVisits[pageKey]?.count ?? 0) + 1,
              lastVisitedAt: new Date().toISOString(),
            },
          },
        }));
        visit(pageKey);
      },
      clearVisits() {
        setCached(() => ({ pageVisits: {} }));
        clear();
      },
    }),
    [setCached, patch, visit, clear],
  );
}
