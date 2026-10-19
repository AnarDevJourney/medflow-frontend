import { api } from "@lib/api/client";

export type TableDensity = "compact" | "comfortable";
export type ColumnPin = "left" | "right";

export interface TableColumnSetting {
  key: string;
  visible: boolean;
  width: number | null; // null = the column's default width
  pinned: ColumnPin | null;
}

// configurations-service: one row per (user, table); null = table default
export interface TableSettings {
  tableKey: string;
  columns: TableColumnSetting[] | null;
  density: TableDensity | null;
  view: string | null;
  updatedAt: string | null;
}

export type TableSettingsPatch = Partial<
  Pick<TableSettings, "columns" | "density" | "view">
>;

const url = (tableKey: string) => `/configurations/tables/${tableKey}`;

export async function getTableSettings(tableKey: string): Promise<TableSettings> {
  const { data } = await api.get<TableSettings>(url(tableKey));
  return data;
}

// Only the sent fields change on the server
export async function updateTableSettings(
  tableKey: string,
  patch: TableSettingsPatch,
): Promise<TableSettings> {
  const { data } = await api.patch<TableSettings>(url(tableKey), patch);
  return data;
}

// Deletes the saved row → the table is back to its defaults
export async function resetTableSettings(tableKey: string): Promise<void> {
  await api.delete(url(tableKey));
}
