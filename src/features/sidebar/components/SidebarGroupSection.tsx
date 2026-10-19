import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dropdown, Input } from "antd";
import { useRef, useState, type PointerEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { useGroupTitle } from "../hooks/useGroupTitle";
import type { SidebarGroupModel } from "../utils/buildSidebar";
import { groupDndId, itemDndId } from "../utils/dndIds";
import { SortableNavItem } from "./SidebarNavItem";
import styles from "./Sidebar.module.css";

interface SidebarGroupSectionProps {
  group: SidebarGroupModel;
  activeKey: string | undefined;
  favorites: ReadonlySet<string>;
  renaming: boolean;
  canDelete: boolean;
  onToggleCollapsed: (id: string) => void;
  onToggleFavorite: (key: string) => void;
  onStartRename: (id: string) => void;
  onRename: (id: string, name: string | null) => void;
  onDelete: (id: string) => void;
}

// A group of pages: header (collapse, rename, delete; drag to reorder
// groups) + its sortable pages. Pages can be dragged between groups.
export function SidebarGroupSection({
  group,
  activeKey,
  favorites,
  renaming,
  canDelete,
  onToggleCollapsed,
  onToggleFavorite,
  onStartRename,
  onRename,
  onDelete,
}: SidebarGroupSectionProps) {
  const { t } = useTranslation();
  const title = useGroupTitle()(group);
  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupDndId(group.id) });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        styles.group,
        group.collapsed && styles.groupCollapsed,
        isDragging && styles.dragging,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
    >
      {/* Pointer drag only: Space/Enter on the header buttons keep their
          normal meaning */}
      <div
        ref={setActivatorNodeRef}
        className={styles.groupHeader}
        onPointerDown={listeners?.onPointerDown as PointerEventHandler | undefined}
        onClick={() => !renaming && onToggleCollapsed(group.id)}
      >
        <button
          type="button"
          className={styles.groupChevron}
          aria-expanded={!group.collapsed}
          aria-label={t(
            group.collapsed ? "sidebar.expandGroup" : "sidebar.collapseGroup",
            {
              name: title,
            },
          )}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapsed(group.id);
          }}
        >
          <DownOutlined />
        </button>
        {renaming ? (
          <RenameInput
            initial={title}
            onDone={(name) => onRename(group.id, name)}
            onCancel={() => onRename(group.id, group.name)}
          />
        ) : (
          <>
            <span
              className={styles.groupTitle}
              onDoubleClick={() => onStartRename(group.id)}
            >
              {title}
            </span>
            <span className={styles.groupCount}>{group.items.length}</span>
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: "rename",
                    icon: <EditOutlined />,
                    label: t("sidebar.renameGroup"),
                  },
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: t("sidebar.deleteGroup"),
                    disabled: !canDelete,
                  },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === "rename") onStartRename(group.id);
                  if (key === "delete") onDelete(group.id);
                },
              }}
            >
              <button
                type="button"
                className={styles.groupActions}
                aria-label={t("sidebar.groupActions", { name: title })}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <MoreOutlined />
              </button>
            </Dropdown>
          </>
        )}
      </div>

      {!group.collapsed && (
        <SortableContext
          items={group.items.map((item) => itemDndId(item.key))}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.groupItems}>
            {group.items.map((item) => (
              <SortableNavItem
                key={item.key}
                id={itemDndId(item.key)}
                item={item}
                active={item.key === activeKey}
                collapsed={false}
                favorite={favorites.has(item.key)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
            {group.items.length === 0 && (
              <div className={styles.emptyGroup}>{t("sidebar.emptyGroup")}</div>
            )}
          </div>
        </SortableContext>
      )}
    </section>
  );
}

// Enter / blur saves, Esc cancels. An empty name keeps the old one.
function RenameInput({
  initial,
  onDone,
  onCancel,
}: {
  initial: string;
  onDone: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  // Enter / Esc unmount the input, which may also fire blur — answer once
  const answered = useRef(false);
  const answer = (save: boolean) => {
    if (answered.current) return;
    answered.current = true;
    if (save && value.trim()) onDone(value.trim());
    else onCancel();
  };

  return (
    <Input
      size="small"
      autoFocus
      maxLength={40}
      value={value}
      className={styles.renameInput}
      onChange={(event) => setValue(event.target.value)}
      onFocus={(event) => event.target.select()}
      onPressEnter={() => answer(true)}
      onBlur={() => answer(true)}
      onKeyDown={(event) => {
        if (event.key === "Escape") answer(false);
        event.stopPropagation(); // no group drag / collapse from typing
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}
