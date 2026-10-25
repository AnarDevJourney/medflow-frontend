import type { TableSettings, TableSettingsPatch, TableSettingsStorage } from "tablesync";
import { api } from "@lib/api/client";
import { ApiError } from "@lib/api/errors";
import { reportServiceError, reportServiceOk } from "@lib/queryClient";

// configurations-service: one row per (signed-in user, table); null = default
const url = (tableKey: string) => `/configurations/tables/${tableKey}`;

// Same rules as the app's queries: a 503 / network error shows the
// "service unavailable" banner, any success clears it
async function request<T>(run: () => Promise<T>): Promise<T> {
  try {
    const result = await run();
    reportServiceOk();
    return result;
  } catch (error) {
    reportServiceError(error);
    throw error;
  }
}

// 4xx answers are final; network / 5xx errors are retried once
const isFinal = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

async function load(tableKey: string): Promise<TableSettings> {
  const get = () => request(() => api.get<TableSettings>(url(tableKey)));
  try {
    return (await get()).data;
  } catch (error) {
    if (isFinal(error)) throw error;
    return (await get()).data;
  }
}

export const tableSettingsStorage: TableSettingsStorage = {
  load,
  // Only the sent fields change on the server
  save: (tableKey: string, patch: TableSettingsPatch) =>
    request(() => api.patch<TableSettings>(url(tableKey), patch)),
  // Deletes the saved row → the table is back to its defaults
  reset: (tableKey: string) => request(() => api.delete(url(tableKey))),
};
