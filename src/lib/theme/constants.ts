// The only three theme choices in the app. Anything that names one of them
// imports this type instead of using string literals.
export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEMES: Theme[] = ["system", "light", "dark"];
export const DEFAULT_THEME: Theme = "system";

export const THEME_STORAGE_KEY = "medflow-theme";

export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}
