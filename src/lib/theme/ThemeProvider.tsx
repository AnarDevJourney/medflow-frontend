import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_THEME, resolveTheme, THEME_STORAGE_KEY, type Theme } from "./constants";
import { ThemeContext } from "./ThemeContext";

function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

const getPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

// System / light / dark, persisted per browser. Sets <html data-theme> for
// the app's own CSS variables; AntD gets its theme from App.tsx.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [prefersDark, setPrefersDark] = useState(getPrefersDark);

  // Follow the OS theme live while theme === "system"
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = resolveTheme(theme, prefersDark);

  // Before paint, so a theme change never flashes the old colors
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode: the choice lasts for this tab only
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
