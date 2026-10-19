import { api } from "@lib/api/client";
import type { Appearance } from "@lib/theme/appearance";

// configurations-service: null = default for that setting
export type ThemeSettings = { [K in keyof Appearance]: Appearance[K] | null } & {
  updatedAt: string | null;
};

export type ThemeSettingsPatch = Partial<{
  [K in keyof Appearance]: Appearance[K] | null;
}>;

const URL = "/configurations/theme";

export async function getThemeSettings(): Promise<ThemeSettings> {
  const { data } = await api.get<ThemeSettings>(URL);
  return data;
}

// Only the sent fields change on the server
export async function updateThemeSettings(
  patch: ThemeSettingsPatch,
): Promise<ThemeSettings> {
  const { data } = await api.patch<ThemeSettings>(URL, patch);
  return data;
}

export async function resetThemeSettings(): Promise<void> {
  await api.delete(URL);
}
