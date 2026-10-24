import { EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import type { DataTableRowAction, DataTableRowMenuItem } from "./types";

interface RowActionsMenuProps {
  items: DataTableRowMenuItem[];
  onViewDetails?: () => void;
  label?: string; // the row's name, for the button's accessible name
}

// Dividers only between two groups of actions
function tidy(items: DataTableRowMenuItem[]): DataTableRowMenuItem[] {
  return items.filter(
    (item, index) =>
      item !== "divider" ||
      (index > 0 && index < items.length - 1 && items[index - 1] !== "divider"),
  );
}

// ⋮ button at the end of a DataTable row. Clicks never reach the row, so
// opening the menu doesn't also trigger onRowClick.
export function RowActionsMenu({ items, onViewDetails, label }: RowActionsMenuProps) {
  const { t } = useTranslation();
  const all = tidy([
    ...(onViewDetails
      ? [
          {
            key: "__details",
            label: t("table.viewDetails"),
            icon: <EyeOutlined />,
            onClick: onViewDetails,
          },
          "divider" as const,
        ]
      : []),
    ...items,
  ]);
  if (all.length === 0) return null;

  const actions = new Map(
    all
      .filter((item): item is DataTableRowAction => item !== "divider")
      .map((item) => [item.key, item]),
  );
  const menuItems: MenuProps["items"] = all.map((item, index) =>
    item === "divider"
      ? { type: "divider", key: `divider-${index}` }
      : {
          key: item.key,
          label: item.label,
          icon: item.icon,
          danger: item.danger,
          disabled: item.disabled,
        },
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items: menuItems,
        onClick: ({ key, domEvent }) => {
          // the menu is in a portal, but React still bubbles to the row
          domEvent.stopPropagation();
          actions.get(key)?.onClick();
        },
      }}
    >
      <Button
        type="text"
        size="small"
        icon={<MoreOutlined />}
        aria-label={
          label ? t("table.rowActionsFor", { name: label }) : t("table.rowActions")
        }
        onClick={(event) => event.stopPropagation()}
        // Enter / Space open the menu, not the row. Other keys must bubble:
        // AntD closes the menu on Esc with a window listener.
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") event.stopPropagation();
        }}
      />
    </Dropdown>
  );
}
