// The only three theme modes in the app. Anything that names one of them
// imports this type instead of using string literals.
export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEMES: Theme[] = ["system", "light", "dark"];

// Last appearance on this browser + its CSS variables, read by the inline
// script in index.html before the first paint (no flash of the default look)
export const APPEARANCE_STORAGE_KEY = "medflow-appearance";
// Before appearance settings only the mode was stored here
export const LEGACY_THEME_STORAGE_KEY = "medflow-theme";

export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}
