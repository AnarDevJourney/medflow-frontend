import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import type { Appearance } from "@lib/theme/appearance";
import { useTheme } from "@lib/theme/useTheme";
import {
  resetThemeSettings,
  updateThemeSettings,
  type ThemeSettings,
} from "../services/themeSettingsService";
import { themeSettingsKey } from "./useSavedAppearance";

const EMPTY: ThemeSettings = {
  mode: null,
  palette: null,
  primaryColor: null,
  sidebarStyle: null,
  density: null,
  motion: null,
  updatedAt: null,
};

// Change the appearance: signed in → cache first (instant), then saved to
// configurations-service; signed out → this browser only.
export function useAppearanceActions() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const { setLocalAppearance } = useTheme();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const onError = () => {
    void message.error(t("appearance.saveError"));
    void queryClient.invalidateQueries({ queryKey: themeSettingsKey(userId) });
  };
  const scope = { id: "theme-settings" };
  const { mutate: patch } = useMutation({
    mutationFn: updateThemeSettings,
    scope,
    onError,
  });
  const { mutate: reset } = useMutation({
    mutationFn: resetThemeSettings,
    scope,
    onError,
  });

  return useMemo(
    () => ({
      update(change: Partial<Appearance>) {
        setLocalAppearance(change); // also kept for after sign-out
        if (!userId) return;
        queryClient.setQueryData<ThemeSettings>(themeSettingsKey(userId), (old) => ({
          ...(old ?? EMPTY),
          ...change,
        }));
        patch(change);
      },
      reset() {
        setLocalAppearance(null);
        if (!userId) return;
        queryClient.setQueryData<ThemeSettings>(themeSettingsKey(userId), EMPTY);
        reset();
      },
    }),
    [setLocalAppearance, userId, queryClient, patch, reset],
  );
}
