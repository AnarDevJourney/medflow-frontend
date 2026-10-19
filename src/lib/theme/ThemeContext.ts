import { createContext } from "react";
import type { Appearance } from "./appearance";
import type { BuiltTheme } from "./buildTheme";
import type { ResolvedTheme } from "./constants";

export interface ThemeContextValue {
  appearance: Appearance; // effective: the user's saved one, or this browser's
  resolvedTheme: ResolvedTheme;
  reducedMotion: boolean;
  built: BuiltTheme;
  // Signed out: changes live in this browser only (null = reset)
  setLocalAppearance: (change: Partial<Appearance> | null) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
