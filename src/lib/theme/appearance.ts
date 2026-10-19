import type { Theme } from "./constants";

// Everything a user can change about how the app looks. Saved per user in
// configurations-service (null there = the default below).
export type UiDensity = "compact" | "comfortable" | "spacious";
export type MotionPreference = "system" | "reduced" | "full";

export interface Appearance {
  mode: Theme;
  palette: PaletteId;
  primaryColor: string; // '#rrggbb'
  sidebarStyle: SidebarStyleId;
  density: UiDensity;
  motion: MotionPreference;
}

// ─── Surface palettes ─────────────────────────────────────
// Neutral families for backgrounds, cards, borders and text. All keep
// WCAG AA for text on their own surfaces.
export interface Surfaces {
  bg: string;
  card: string;
  hover: string;
  border: string;
  text: string;
  muted: string;
}

export type PaletteId = "default" | "slate" | "neutral" | "warm" | "ocean";

export const PALETTES: Record<PaletteId, { light: Surfaces; dark: Surfaces }> = {
  // Slightly cool teal-grey — the original MedFlow look
  default: {
    light: {
      bg: "#f4f7f7",
      card: "#ffffff",
      hover: "#eef3f3",
      border: "#e3e8e8",
      text: "#1f2933",
      muted: "#5f6b73",
    },
    dark: {
      bg: "#0b1416",
      card: "#111c1f",
      hover: "#18272b",
      border: "#25353a",
      text: "#e8eef0",
      muted: "#93a3a8",
    },
  },
  slate: {
    light: {
      bg: "#f5f7fa",
      card: "#ffffff",
      hover: "#eef2f7",
      border: "#e2e8f0",
      text: "#1e293b",
      muted: "#5b6779",
    },
    dark: {
      bg: "#0b1120",
      card: "#111827",
      hover: "#18233a",
      border: "#243042",
      text: "#e5e9f0",
      muted: "#94a3b8",
    },
  },
  neutral: {
    light: {
      bg: "#f6f6f6",
      card: "#ffffff",
      hover: "#efefef",
      border: "#e5e5e5",
      text: "#1f1f1f",
      muted: "#646464",
    },
    dark: {
      bg: "#111111",
      card: "#1a1a1a",
      hover: "#242424",
      border: "#2e2e2e",
      text: "#ececec",
      muted: "#a0a0a0",
    },
  },
  warm: {
    light: {
      bg: "#f7f5f2",
      card: "#fffefc",
      hover: "#f0ece6",
      border: "#e7e2da",
      text: "#292524",
      muted: "#6f6762",
    },
    dark: {
      bg: "#14110f",
      card: "#1c1917",
      hover: "#27221f",
      border: "#352f2b",
      text: "#ede9e5",
      muted: "#a8a29e",
    },
  },
  ocean: {
    light: {
      bg: "#f2f6fb",
      card: "#ffffff",
      hover: "#eaf0f8",
      border: "#dde5f0",
      text: "#172033",
      muted: "#56637a",
    },
    dark: {
      bg: "#070d1a",
      card: "#0d1526",
      hover: "#152039",
      border: "#1f2b44",
      text: "#e6ecf7",
      muted: "#8d9bb5",
    },
  },
};

// ─── Accent colors ────────────────────────────────────────
// `light` passes AA with white text (primary buttons); `dark` is the
// brighter shade used on dark surfaces.
export const PRIMARY_PRESETS = [
  { id: "teal", light: "#0f766e", dark: "#14b8a6" },
  { id: "cyan", light: "#0e7490", dark: "#22d3ee" },
  { id: "blue", light: "#2563eb", dark: "#60a5fa" },
  { id: "indigo", light: "#4f46e5", dark: "#818cf8" },
  { id: "violet", light: "#7c3aed", dark: "#a78bfa" },
  { id: "rose", light: "#e11d48", dark: "#fb7185" },
  { id: "orange", light: "#c2410c", dark: "#fb923c" },
  { id: "green", light: "#15803d", dark: "#4ade80" },
] as const;

// ─── Sidebar styles ───────────────────────────────────────
export type SidebarStyleId = "default" | "tinted" | "dark" | "accent";
export const SIDEBAR_STYLES: SidebarStyleId[] = ["default", "tinted", "dark", "accent"];

export const DENSITIES: UiDensity[] = ["compact", "comfortable", "spacious"];
export const MOTIONS: MotionPreference[] = ["system", "reduced", "full"];

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "system",
  palette: "default",
  primaryColor: PRIMARY_PRESETS[0].light,
  sidebarStyle: "default",
  density: "comfortable",
  motion: "system",
};

// Server / storage values → a complete, valid Appearance (unknown ids from
// an older or newer frontend fall back to the default)
export function normalizeAppearance(
  raw: Partial<Record<keyof Appearance, unknown>> | null | undefined,
): Appearance {
  const pick = <K extends keyof Appearance>(key: K, valid: readonly unknown[]) =>
    (valid.includes(raw?.[key]) ? raw?.[key] : DEFAULT_APPEARANCE[key]) as Appearance[K];
  const primary = raw?.primaryColor;
  return {
    mode: pick("mode", ["system", "light", "dark"]),
    palette: pick("palette", Object.keys(PALETTES)),
    primaryColor:
      typeof primary === "string" && /^#[0-9a-f]{6}$/i.test(primary)
        ? primary.toLowerCase()
        : DEFAULT_APPEARANCE.primaryColor,
    sidebarStyle: pick("sidebarStyle", SIDEBAR_STYLES),
    density: pick("density", DENSITIES),
    motion: pick("motion", MOTIONS),
  };
}
