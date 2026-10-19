import {
  ClockCircleOutlined,
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Layout, Popover, Skeleton, Tooltip } from "antd";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { findNavItem, NAV_ITEMS, type NavItem } from "@components/layout/navigation";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import {
  useSidebarSettings,
  useSidebarSettingsActions,
} from "../hooks/useSidebarSettings";
import { useGroupTitle } from "../hooks/useGroupTitle";
import {
  buildSidebar,
  toSavedGroups,
  type SidebarGroupModel,
} from "../utils/buildSidebar";
import { favDndId, groupDndId, isGroupId, isItemId, keyOf } from "../utils/dndIds";
import { SidebarCustomize } from "./SidebarCustomize";
import { SidebarGroupSection } from "./SidebarGroupSection";
import { SidebarNavItem, SortableNavItem } from "./SidebarNavItem";
import styles from "./Sidebar.module.css";

const navItemByKey = new Map(NAV_ITEMS.map((item) => [item.key, item]));

// Space picks up / drops with the keyboard; Enter keeps opening the page
const keyboardCodes = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space],
};

// Groups are only compared with groups. A page goes to the page under the
// pointer, else to the group under it (empty / collapsed group), else to
// the nearest page.
const collisionDetection: CollisionDetection = (args) => {
  const only = (match: (id: string) => boolean) => ({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => match(String(c.id))),
  });
  if (isGroupId(String(args.active.id))) return closestCenter(only(isGroupId));

  const overItem = pointerWithin(only(isItemId));
  if (overItem.length > 0) return overItem;
  const overGroup = pointerWithin(only(isGroupId));
  if (overGroup.length > 0) return overGroup;
  return closestCenter(only(isItemId));
};

const groupIndexOf = (groups: SidebarGroupModel[], dndId: string) =>
  isGroupId(dndId)
    ? groups.findIndex((group) => group.id === keyOf(dndId))
    : groups.findIndex((group) => group.items.some((item) => item.key === keyOf(dndId)));

// Sidebar of every signed-in page. Its configuration (order, groups,
// favorites, collapsed, visits) is per user in configurations-service.
export function Sidebar() {
  const { t } = useTranslation();
  const groupTitle = useGroupTitle();
  const { pathname } = useLocation();
  const { data: user } = useCurrentUser();
  const { settings, isReady } = useSidebarSettings(user?.id);
  const actions = useSidebarSettingsActions(user?.id);

  const activeKey = findNavItem(pathname)?.key;
  const collapsed = settings?.collapsed ?? false;
  const model = useMemo(
    () => (settings && user ? buildSidebar(settings, user.role, activeKey) : null),
    [settings, user, activeKey],
  );
  const favoriteKeys = useMemo(() => new Set(settings?.favorites ?? []), [settings]);

  // Count a visit each time the user lands on another page
  const lastVisit = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isReady || !activeKey || lastVisit.current === activeKey) return;
    lastVisit.current = activeKey;
    actions.recordVisit(activeKey);
  }, [isReady, activeKey, actions]);

  // ─── Drag & drop state ───────────────────────────────────
  // While dragging, groups render from a draft (pages move between groups
  // live); on drop the draft is saved and the cache takes over again.
  const [draft, setDraft] = useState<SidebarGroupModel[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  // A drop ends with a click on the link under the pointer — swallow it
  const justDropped = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes,
    }),
  );

  if (!settings || !model) {
    return (
      <Layout.Sider
        className={styles.sider}
        width="var(--sidebar-width)"
        collapsedWidth="var(--sidebar-collapsed-width)"
        collapsed={collapsed}
        trigger={null}
      >
        <Brand collapsed={collapsed} />
        <div className={styles.skeleton} aria-busy="true">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton.Button key={i} active block size="small" />
          ))}
        </div>
      </Layout.Sider>
    );
  }

  const groups = draft ?? model.groups;
  const saveGroups = (next: SidebarGroupModel[]) =>
    actions.update({ groups: toSavedGroups(next) });

  const toggleFavorite = (key: string) =>
    actions.update({
      favorites: favoriteKeys.has(key)
        ? settings.favorites.filter((k) => k !== key)
        : [...settings.favorites, key],
    });

  const endDrag = () => {
    setDraft(null);
    setDragId(null);
    justDropped.current = true;
    setTimeout(() => (justDropped.current = false), 0);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragId(String(active.id));
    setDraft(model.groups);
  };

  // Page dragged over another group → move it there right away
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const activeId = String(active.id);
    if (!over || isGroupId(activeId)) return;
    const overId = String(over.id);
    setDraft((prev) => {
      if (!prev) return prev;
      const from = groupIndexOf(prev, activeId);
      const to = groupIndexOf(prev, overId);
      if (from < 0 || to < 0 || from === to) return prev;
      const item = prev[from].items.find((i) => i.key === keyOf(activeId))!;
      const target = prev[to].items;
      const overIndex = target.findIndex((i) => i.key === keyOf(overId));
      const at = overIndex < 0 ? target.length : overIndex;
      return prev.map((group, index) => {
        if (index === from) {
          return { ...group, items: group.items.filter((i) => i.key !== item.key) };
        }
        if (index === to) {
          return { ...group, items: [...target.slice(0, at), item, ...target.slice(at)] };
        }
        return group;
      });
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const activeId = String(active.id);
    let next = draft ?? model.groups;
    if (over) {
      const overId = String(over.id);
      if (isGroupId(activeId)) {
        const from = groupIndexOf(next, activeId);
        const to = groupIndexOf(next, overId);
        if (from >= 0 && to >= 0 && from !== to) next = arrayMove(next, from, to);
      } else {
        const index = groupIndexOf(next, activeId);
        const group = next[index];
        const from = group.items.findIndex((i) => i.key === keyOf(activeId));
        const to = group.items.findIndex((i) => i.key === keyOf(overId));
        if (to >= 0 && from !== to) {
          next = next.map((g, i) =>
            i === index ? { ...g, items: arrayMove(g.items, from, to) } : g,
          );
        }
      }
    }
    if (
      JSON.stringify(toSavedGroups(next)) !== JSON.stringify(toSavedGroups(model.groups))
    ) {
      saveGroups(next);
    }
    endDrag();
  };

  const onFavoritesDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const keys = model.favorites.map((item) => item.key);
      const from = keys.indexOf(keyOf(String(active.id)));
      const to = keys.indexOf(keyOf(String(over.id)));
      actions.update({ favorites: arrayMove(keys, from, to) });
    }
    endDrag();
  };

  // ─── Group actions ───────────────────────────────────────
  const updateGroup = (id: string, change: Partial<SidebarGroupModel>) =>
    saveGroups(
      model.groups.map((group) => (group.id === id ? { ...group, ...change } : group)),
    );

  const renameGroup = (id: string, name: string | null) => {
    setRenamingId(null);
    const group = model.groups.find((g) => g.id === id);
    if (group && name !== group.name && name !== groupTitle(group))
      updateGroup(id, { name });
  };

  // The pages go back to their built-in group, or to the first group left
  const deleteGroup = (id: string) => {
    const rest = model.groups.filter((group) => group.id !== id);
    const moved = model.groups.find((group) => group.id === id)?.items ?? [];
    saveGroups(
      rest.map((group, index) => ({
        ...group,
        items: [
          ...group.items,
          ...moved.filter((item) =>
            rest.some((g) => g.id === item.group) ? item.group === group.id : index === 0,
          ),
        ],
      })),
    );
  };

  const newGroup = () => {
    const id = `g-${Math.random().toString(36).slice(2, 8)}`;
    saveGroups([
      ...model.groups,
      { id, name: t("sidebar.newGroupName"), collapsed: false, items: [] },
    ]);
    setRenamingId(id);
  };

  const resetLayout = () =>
    actions.update({ groups: null, favorites: [], showFrequent: true, showRecent: true });

  // ─── Render ──────────────────────────────────────────────
  const dragged =
    dragId && !isGroupId(dragId) ? navItemByKey.get(keyOf(dragId)) : undefined;
  const draggedGroup =
    dragId && isGroupId(dragId)
      ? groups.find((group) => group.id === keyOf(dragId))
      : undefined;

  const quickSection = (icon: ReactNode, title: string, items: NavItem[]) =>
    items.length > 0 && (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon} aria-hidden="true">
            {icon}
          </span>
          {title}
        </div>
        <div className={styles.list}>
          {items.map((item) => (
            <SidebarNavItem
              key={item.key}
              item={item}
              active={item.key === activeKey}
              collapsed={false}
              favorite={favoriteKeys.has(item.key)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>
    );

  const quickAccess = [...model.frequent, ...model.recent];

  return (
    <Layout.Sider
      className={[styles.sider, collapsed && styles.collapsed].filter(Boolean).join(" ")}
      width="var(--sidebar-width)"
      collapsedWidth="var(--sidebar-collapsed-width)"
      collapsed={collapsed}
      trigger={null}
    >
      <Brand collapsed={collapsed} />

      <nav
        className={styles.scroll}
        aria-label={t("sidebar.label")}
        onClickCapture={(event) => {
          if (justDropped.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {collapsed ? (
          // Icons only: favorites, quick access in a popover, then every
          // group's pages (group folding does not apply here)
          <div className={styles.list}>
            {model.favorites.map((item) => (
              <SidebarNavItem
                key={item.key}
                item={item}
                active={item.key === activeKey}
                collapsed
              />
            ))}
            {quickAccess.length > 0 && (
              <Popover
                placement="rightTop"
                arrow={false}
                content={
                  <div className={styles.quickList}>
                    {model.frequent.length > 0 && (
                      <div className={styles.quickTitle}>{t("sidebar.frequent")}</div>
                    )}
                    {model.frequent.map((item) => (
                      <SidebarNavItem
                        key={item.key}
                        item={item}
                        active={false}
                        collapsed={false}
                      />
                    ))}
                    {model.recent.length > 0 && (
                      <div className={styles.quickTitle}>{t("sidebar.recent")}</div>
                    )}
                    {model.recent.map((item) => (
                      <SidebarNavItem
                        key={item.key}
                        item={item}
                        active={false}
                        collapsed={false}
                      />
                    ))}
                  </div>
                }
              >
                <div className={styles.row}>
                  <button
                    type="button"
                    className={styles.item}
                    aria-label={t("sidebar.quickAccess")}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      <ClockCircleOutlined />
                    </span>
                  </button>
                </div>
              </Popover>
            )}
            {model.groups.map((group) => (
              <Fragment key={group.id}>
                {group.items.length > 0 && <div className={styles.divider} />}
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    active={item.key === activeKey}
                    collapsed
                  />
                ))}
              </Fragment>
            ))}
          </div>
        ) : (
          <>
            {model.favorites.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <span className={styles.sectionIcon} aria-hidden="true">
                    <StarOutlined />
                  </span>
                  {t("sidebar.favorites")}
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={({ active }) => setDragId(String(active.id))}
                  onDragEnd={onFavoritesDragEnd}
                  onDragCancel={endDrag}
                >
                  <SortableContext
                    items={model.favorites.map((item) => favDndId(item.key))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className={styles.list}>
                      {model.favorites.map((item) => (
                        <SortableNavItem
                          key={item.key}
                          id={favDndId(item.key)}
                          item={item}
                          active={item.key === activeKey}
                          collapsed={false}
                          favorite
                          inFavorites
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
            {quickSection(<ThunderboltOutlined />, t("sidebar.frequent"), model.frequent)}
            {quickSection(<ClockCircleOutlined />, t("sidebar.recent"), model.recent)}
            {(model.favorites.length > 0 || quickAccess.length > 0) && (
              <div className={styles.divider} />
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={endDrag}
            >
              <SortableContext
                items={groups.map((group) => groupDndId(group.id))}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((group) => (
                  <SidebarGroupSection
                    key={group.id}
                    group={group}
                    activeKey={activeKey}
                    favorites={favoriteKeys}
                    renaming={renamingId === group.id}
                    canDelete={groups.length > 1}
                    onToggleCollapsed={(id) =>
                      updateGroup(id, {
                        collapsed: !model.groups.find((g) => g.id === id)?.collapsed,
                      })
                    }
                    onToggleFavorite={toggleFavorite}
                    onStartRename={setRenamingId}
                    onRename={renameGroup}
                    onDelete={deleteGroup}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {dragged && (
                  <SidebarNavItem
                    item={dragged}
                    active={false}
                    collapsed={false}
                    className={styles.overlay}
                  />
                )}
                {draggedGroup && (
                  <div className={`${styles.overlay} ${styles.overlayGroup}`}>
                    <div className={styles.sectionTitle}>{groupTitle(draggedGroup)}</div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </nav>

      <div className={styles.footer}>
        <SidebarCustomize
          collapsed={collapsed}
          showFrequent={settings.showFrequent}
          showRecent={settings.showRecent}
          onShowFrequent={(showFrequent) => actions.update({ showFrequent })}
          onShowRecent={(showRecent) => actions.update({ showRecent })}
          onNewGroup={() => {
            if (collapsed) actions.update({ collapsed: false });
            newGroup();
          }}
          onClearHistory={actions.clearVisits}
          onReset={resetLayout}
        />
        <Tooltip
          title={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
          placement="right"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            aria-label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
            onClick={() => actions.update({ collapsed: !collapsed })}
          />
        </Tooltip>
      </div>
    </Layout.Sider>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={styles.brand}>
      <MedicineBoxOutlined className={styles.brandMark} />
      {!collapsed && t("app.name")}
    </div>
  );
}
