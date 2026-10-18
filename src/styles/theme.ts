import { theme as antdTheme, type ThemeConfig } from "antd";

// Calm clinical UI: lots of white space, one teal accent (DOC 9). AntD needs
// plain color values (it derives shades from them); global.css mirrors the
// same values as CSS variables for the app's own elements.
export const tokens = {
  primary: "#0f766e",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  bg: "#f4f7f7",
  card: "#ffffff",
  border: "#e3e8e8",
  text: "#1f2933",
  muted: "#6b7780",
};

export const darkTokens = {
  primary: "#14b8a6",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  bg: "#0b1416",
  card: "#111c1f",
  border: "#25353a",
  text: "#e8eef0",
  muted: "#93a3a8",
};

// Appointment status colors (DOC 9) — used by tags and the calendar
export const statusColors = {
  SCHEDULED: "blue",
  CHECKED_IN: "gold",
  IN_PROGRESS: "purple",
  COMPLETED: "green",
  CANCELLED: "default",
  NO_SHOW: "red",
} as const;

const shared: ThemeConfig = {
  token: {
    borderRadius: 8,
    fontFamily:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...shared.token,
    colorPrimary: tokens.primary,
    colorSuccess: tokens.success,
    colorWarning: tokens.warning,
    colorError: tokens.error,
    colorBgLayout: tokens.bg,
    colorBgContainer: tokens.card,
    colorBorder: tokens.border,
    colorText: tokens.text,
    colorTextSecondary: tokens.muted,
  },
  components: {
    Layout: { siderBg: tokens.card, headerBg: tokens.card, bodyBg: tokens.bg },
    Menu: { itemBg: tokens.card },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...shared.token,
    colorPrimary: darkTokens.primary,
    colorSuccess: darkTokens.success,
    colorWarning: darkTokens.warning,
    colorError: darkTokens.error,
    colorBgLayout: darkTokens.bg,
    colorBgContainer: darkTokens.card,
    colorBorder: darkTokens.border,
    colorText: darkTokens.text,
    colorTextSecondary: darkTokens.muted,
  },
  components: {
    Layout: {
      siderBg: darkTokens.card,
      headerBg: darkTokens.card,
      bodyBg: darkTokens.bg,
    },
    Menu: { itemBg: darkTokens.card },
  },
};
