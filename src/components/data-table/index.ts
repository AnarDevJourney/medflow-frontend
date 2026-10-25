// MedFlow's tables come from the tablesync package (vendor/*.tgz until it is
// on npm); MedflowTableSync wires it to configurations-service.
export { DataTable, TABLE_VIEWS } from "tablesync";
export type {
  DataTableColumn,
  DataTableEmptyState,
  DataTablePagination,
  DataTableProps,
  DataTableRowAction,
  DataTableRowMenuItem,
  DataTableSort,
  TableDensity,
  TableViewId,
} from "tablesync";
export { MedflowTableSync } from "./MedflowTableSync";
