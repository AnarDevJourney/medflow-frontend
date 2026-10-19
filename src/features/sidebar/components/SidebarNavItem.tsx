import { StarFilled, StarOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "antd";
import type { HTMLAttributes, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { NavItem } from "@components/layout/navigation";
import styles from "./Sidebar.module.css";

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  favorite?: boolean;
  inFavorites?: boolean; // shown in the Favorites section
  onToggleFavorite?: (key: string) => void;
  // set by SortableNavItem
  rowRef?: Ref<HTMLDivElement>;
  rowProps?: HTMLAttributes<HTMLDivElement>;
  className?: string;
}

// One page link. Expanded: icon + label + favorite star on hover.
// Collapsed: icon only, the label in a tooltip.
export function SidebarNavItem({
  item,
  active,
  collapsed,
  favorite = false,
  inFavorites = false,
  onToggleFavorite,
  rowRef,
  rowProps,
  className,
}: SidebarNavItemProps) {
  const { t } = useTranslation();
  const label = t(item.labelKey);

  const link = (
    <Link
      to={item.path}
      className={styles.item}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      draggable={false}
    >
      <span className={styles.itemIcon} aria-hidden="true">
        {item.icon}
      </span>
      {!collapsed && <span className={styles.itemLabel}>{label}</span>}
    </Link>
  );

  return (
    <div
      ref={rowRef}
      {...rowProps}
      className={[
        styles.row,
        active && styles.active,
        favorite && styles.favorite,
        inFavorites && styles.inFavorites,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {collapsed ? (
        <Tooltip title={label} placement="right" mouseEnterDelay={0.15}>
          {link}
        </Tooltip>
      ) : (
        link
      )}
      {!collapsed && onToggleFavorite && (
        <Tooltip
          title={t(favorite ? "sidebar.removeFavorite" : "sidebar.addFavorite")}
          mouseEnterDelay={0.4}
        >
          <button
            type="button"
            className={styles.star}
            aria-pressed={favorite}
            aria-label={t(favorite ? "sidebar.removeFavorite" : "sidebar.addFavorite")}
            onClick={() => onToggleFavorite(item.key)}
            onPointerDown={(event) => event.stopPropagation()} // not a drag
          >
            {favorite ? <StarFilled /> : <StarOutlined />}
          </button>
        </Tooltip>
      )}
    </div>
  );
}

type SortableNavItemProps = Omit<
  SidebarNavItemProps,
  "rowRef" | "rowProps" | "className"
> & {
  id: string; // dnd id, e.g. "item:patients"
};

// The same link, draggable. The whole row is the handle; Space picks it up
// with the keyboard (Enter keeps opening the page).
export function SortableNavItem({ id, ...props }: SortableNavItemProps) {
  // No dnd-kit `attributes`: their role="button" would hide the link inside
  // from screen readers (button children are presentational)
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <SidebarNavItem
      {...props}
      rowRef={setNodeRef}
      rowProps={{
        ...listeners, // keydown bubbles up from the focused link
        style: { transform: CSS.Translate.toString(transform), transition },
      }}
      className={[styles.sortable, isDragging && styles.dragging]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
