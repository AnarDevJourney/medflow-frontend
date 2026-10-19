import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { normalizeAppearance, type Appearance } from "@lib/theme/appearance";
import { getThemeSettings } from "../services/themeSettingsService";

export const themeSettingsKey = (userId: string | undefined) =>
  ["configurations", "theme", userId] as const;

// The signed-in user's appearance, fetched once per session. undefined while
// signed out / loading / on error → ThemeProvider uses this browser's last one.
export function useSavedAppearance(): Appearance | undefined {
  const { data: user } = useCurrentUser();
  const { data } = useQuery({
    queryKey: themeSettingsKey(user?.id),
    queryFn: getThemeSettings,
    enabled: Boolean(user),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
  return useMemo(() => (data ? normalizeAppearance(data) : undefined), [data]);
}
