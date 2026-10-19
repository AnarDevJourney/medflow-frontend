import type { TableViewId } from "./types";

// Ready-made looks of every DataTable. Each one is only CSS (DataTable.module.css,
// `.view-<id>`); the columns, data and behaviour stay the same.
export const TABLE_VIEWS: { id: TableViewId; nameKey: string; descKey: string }[] = [
  {
    id: "classic",
    nameKey: "table.views.classic.name",
    descKey: "table.views.classic.desc",
  },
  {
    id: "striped",
    nameKey: "table.views.striped.name",
    descKey: "table.views.striped.desc",
  },
  { id: "grid", nameKey: "table.views.grid.name", descKey: "table.views.grid.desc" },
  {
    id: "minimal",
    nameKey: "table.views.minimal.name",
    descKey: "table.views.minimal.desc",
  },
  { id: "cards", nameKey: "table.views.cards.name", descKey: "table.views.cards.desc" },
  {
    id: "accent",
    nameKey: "table.views.accent.name",
    descKey: "table.views.accent.desc",
  },
];

export const DEFAULT_TABLE_VIEW: TableViewId = "classic";

export const isTableView = (id: string | null | undefined): id is TableViewId =>
  TABLE_VIEWS.some((view) => view.id === id);
