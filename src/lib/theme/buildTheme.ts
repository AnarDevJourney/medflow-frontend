import { theme as antdTheme, type ThemeConfig } from "antd";
import { PALETTES, PRIMARY_PRESETS, type Appearance, type Surfaces } from "./appearance";
import { mix, rgba } from "./color";
import type { ResolvedTheme } from "./constants";

const FONT_FAMILY =
  "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Fixed semantic colors (never themable: they carry meaning)
const SEMANTIC = {
  light: { success: "#16a34a", warning: "#d97706", error: "#dc2626" },
  dark: { success: "#22c55e", warning: "#f59e0b", error: "#ef4444" },
};

export interface SidebarColors {
  bg: string;
  text: string;
  muted: string;
  hover: string;
  activeBg: string;
  activeText: string;
  border: string;
  brand: string;
}

export interface BuiltTheme {
  antd: ThemeConfig;
  vars: Record<string, string>; // CSS variables for the app's own styles
  surfaces: Surfaces;
  primary: string;
  sidebar: SidebarColors;
}

// The accent shade for this mode: presets have a hand-picked dark shade,
// a custom color is lightened for dark surfaces
export function primaryFor(color: string, mode: ResolvedTheme): string {
  if (mode === "light") return color;
  const preset = PRIMARY_PRESETS.find((p) => p.light === color);
  return preset ? preset.dark : mix(color, "#ffffff", 0.35);
}

function sidebarColors(
  style: Appearance["sidebarStyle"],
  s: Surfaces,
  primary: string,
  baseColor: string,
  mode: ResolvedTheme,
): SidebarColors {
  const onDarkPrimary = primaryFor(baseColor, "dark");
  switch (style) {
    case "tinted":
      return {
        bg: mix(s.card, primary, mode === "light" ? 0.06 : 0.08),
        text: s.text,
        muted: s.muted,
        hover: mix(s.card, primary, mode === "light" ? 0.12 : 0.14),
        activeBg: mix(s.card, primary, mode === "light" ? 0.18 : 0.22),
        activeText: primary,
        border: mix(s.border, primary, 0.12),
        brand: primary,
      };
    case "dark": {
      const bg = mode === "light" ? "#111c1f" : mix(s.bg, "#000000", 0.35);
      return {
        bg,
        text: "#e6edef",
        muted: "#93a3a8",
        hover: "rgb(255 255 255 / 0.06)",
        activeBg: rgba(onDarkPrimary, 0.16),
        activeText: onDarkPrimary,
        border: "rgb(255 255 255 / 0.07)",
        brand: onDarkPrimary,
      };
    }
    case "accent": {
      const bg =
        mode === "light" ? mix(baseColor, "#000000", 0.3) : mix(s.card, baseColor, 0.3);
      return {
        bg,
        text: "#ffffff",
        muted: "rgb(255 255 255 / 0.68)",
        hover: "rgb(255 255 255 / 0.1)",
        activeBg: "rgb(255 255 255 / 0.18)",
        activeText: "#ffffff",
        border: "rgb(255 255 255 / 0.08)",
        brand: "#ffffff",
      };
    }
    default:
      return {
        bg: s.card,
        text: s.text,
        muted: s.muted,
        hover: s.hover,
        activeBg: rgba(primary, mode === "light" ? 0.09 : 0.12),
        activeText: primary,
        border: s.border,
        brand: primary,
      };
  }
}

// Density changes control heights and spacing, never the font size (body
// text stays 14px in every mode; AntD's compactAlgorithm would drop it to 12)
const DENSITY = {
  compact: {
    navItem: "32px",
    content: "16px",
    gap: "1px",
    antd: { controlHeight: 28, sizeStep: 3 },
  },
  comfortable: { navItem: "36px", content: "24px", gap: "2px", antd: {} },
  spacious: {
    navItem: "42px",
    content: "32px",
    gap: "4px",
    antd: { controlHeight: 38, sizeStep: 5 },
  },
};

// Fixed in every density: sticky table headers sit right below it
const HEADER_HEIGHT = 64;

// Appearance + resolved light/dark + reduced motion → AntD theme and the
// matching CSS variables. The only place where colors are decided.
export function buildTheme(
  appearance: Appearance,
  mode: ResolvedTheme,
  reducedMotion: boolean,
): BuiltTheme {
  const s = PALETTES[appearance.palette][mode];
  const primary = primaryFor(appearance.primaryColor, mode);
  const semantic = SEMANTIC[mode];
  const sidebar = sidebarColors(
    appearance.sidebarStyle,
    s,
    primary,
    appearance.primaryColor,
    mode,
  );
  const density = DENSITY[appearance.density];

  const algorithm =
    mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  const antd: ThemeConfig = {
    algorithm,
    token: {
      colorPrimary: primary,
      colorInfo: primary,
      colorSuccess: semantic.success,
      colorWarning: semantic.warning,
      colorError: semantic.error,
      colorBgLayout: s.bg,
      colorBgContainer: s.card,
      colorBorder: s.border,
      colorBorderSecondary: s.border,
      colorText: s.text,
      colorTextSecondary: s.muted,
      borderRadius: 8,
      fontFamily: FONT_FAMILY,
      motion: !reducedMotion,
      ...density.antd,
    },
    components: {
      Layout: {
        siderBg: sidebar.bg,
        headerBg: s.card,
        bodyBg: s.bg,
        headerHeight: HEADER_HEIGHT,
      },
    },
  };

  const motionFast = reducedMotion ? "0ms" : "150ms";
  const vars: Record<string, string> = {
    "--color-primary": primary,
    "--color-primary-soft": rgba(primary, mode === "light" ? 0.09 : 0.12),
    "--color-bg": s.bg,
    "--color-card": s.card,
    "--color-hover": s.hover,
    "--color-border": s.border,
    "--color-text": s.text,
    "--color-muted": s.muted,
    "--sidebar-bg": sidebar.bg,
    "--sidebar-text": sidebar.text,
    "--sidebar-muted": sidebar.muted,
    "--sidebar-hover": sidebar.hover,
    "--sidebar-active-bg": sidebar.activeBg,
    "--sidebar-active-text": sidebar.activeText,
    "--sidebar-border": sidebar.border,
    "--sidebar-brand": sidebar.brand,
    "--nav-item-height": density.navItem,
    "--nav-item-gap": density.gap,
    "--content-padding": density.content,
    "--motion-fast": motionFast,
    "--motion-base": reducedMotion ? "0ms" : "200ms",
  };

  return { antd, vars, surfaces: s, primary, sidebar };
}
