import { QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import azAZ from "antd/locale/az_AZ";
import enUS from "antd/locale/en_US";
import ruRU from "antd/locale/ru_RU";
import { useTranslation } from "react-i18next";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@lib/queryClient";
import { useTheme } from "@lib/theme/useTheme";
import { router } from "@router/index";
import { store } from "@store/index";
import { darkTheme, lightTheme } from "@styles/theme";

const ANTD_LOCALES = { az: azAZ, en: enUS, ru: ruRU };

// Root: Redux (UI state) → React Query (server state) → AntD theme + locale
// → AntD App (theme-aware message / notification / modal) → router
export default function App() {
  const { resolvedTheme } = useTheme();
  const { i18n } = useTranslation();
  const locale = ANTD_LOCALES[i18n.resolvedLanguage as keyof typeof ANTD_LOCALES] ?? enUS;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={resolvedTheme === "dark" ? darkTheme : lightTheme}
          locale={locale}
        >
          <AntApp notification={{ placement: "topRight", maxCount: 3 }}>
            <RouterProvider router={router} />
          </AntApp>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
