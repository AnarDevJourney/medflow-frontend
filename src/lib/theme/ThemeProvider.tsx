import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_APPEARANCE, normalizeAppearance, type Appearance } from "./appearance";
import { buildTheme } from "./buildTheme";
import {
  APPEARANCE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  resolveTheme,
} from "./constants";
import { ThemeContext } from "./ThemeContext";

function readStoredAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (raw)
      return normalizeAppearance((JSON.parse(raw) as { appearance?: object }).appearance);
    return normalizeAppearance({ mode: localStorage.getItem(LEGACY_THEME_STORAGE_KEY) });
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

interface ThemeProviderProps {
  // The signed-in user's saved appearance (undefined while unknown / signed out)
  saved: Appearance | undefined;
  children: ReactNode;
}

// Applies the appearance: <html data-theme / data-density / data-motion>,
// the CSS variables, and (via useTheme) the AntD theme for App.tsx.
// Source: the user's saved settings; signed out or still loading, the last
// appearance used on this browser.
export function ThemeProvider({ saved, children }: ThemeProviderProps) {
  const [local, setLocal] = useState<Appearance>(readStoredAppearance);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const appearance = saved ?? local;
  const resolvedTheme = resolveTheme(appearance.mode, prefersDark);
  const reducedMotion =
    appearance.motion === "reduced" ||
    (appearance.motion === "system" && prefersReducedMotion);
  const built = useMemo(
    () => buildTheme(appearance, resolvedTheme, reducedMotion),
    [appearance, resolvedTheme, reducedMotion],
  );

  // Before paint, so a change never flashes the old colors
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-density", appearance.density);
    root.setAttribute("data-motion", reducedMotion ? "reduced" : "full");
    for (const [name, value] of Object.entries(built.vars))
      root.style.setProperty(name, value);
  }, [built, resolvedTheme, appearance.density, reducedMotion]);

  // Snapshot for the next page load (index.html applies it before React runs)
  useEffect(() => {
    try {
      localStorage.setItem(
        APPEARANCE_STORAGE_KEY,
        JSON.stringify({
          appearance,
          vars: {
            light: buildTheme(appearance, "light", reducedMotion).vars,
            dark: buildTheme(appearance, "dark", reducedMotion).vars,
          },
        }),
      );
    } catch {
      // storage blocked: the look is just rebuilt on the next load
    }
  }, [appearance, reducedMotion]);

  const setLocalAppearance = useCallback(
    (change: Partial<Appearance> | null) =>
      setLocal((current) => (change ? { ...current, ...change } : DEFAULT_APPEARANCE)),
    [],
  );

  const value = useMemo(
    () => ({ appearance, resolvedTheme, reducedMotion, built, setLocalAppearance }),
    [appearance, resolvedTheme, reducedMotion, built, setLocalAppearance],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
