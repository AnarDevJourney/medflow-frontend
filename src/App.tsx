import { QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import azAZ from "antd/locale/az_AZ";
import enUS from "antd/locale/en_US";
import ruRU from "antd/locale/ru_RU";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { useSavedAppearance } from "@features/appearance/hooks/useSavedAppearance";
import { queryClient } from "@lib/queryClient";
import { ThemeProvider } from "@lib/theme/ThemeProvider";
import { useTheme } from "@lib/theme/useTheme";
import { router } from "@router/index";
import { store } from "@store/index";

const ANTD_LOCALES = { az: azAZ, en: enUS, ru: ruRU };

// Root: Redux (UI state) → React Query (server state) → appearance (the
// user's saved theme) → AntD theme + locale → AntD App (theme-aware
// message / notification / modal) → router
export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SavedThemeProvider />
      </QueryClientProvider>
    </Provider>
  );
}

function SavedThemeProvider() {
  return (
    <ThemeProvider saved={useSavedAppearance()}>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { built } = useTheme();
  const { i18n } = useTranslation();
  const locale = ANTD_LOCALES[i18n.resolvedLanguage as keyof typeof ANTD_LOCALES] ?? enUS;

  return (
    <ConfigProvider theme={built.antd} locale={locale}>
      <AntApp notification={{ placement: "topRight", maxCount: 3 }}>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}
