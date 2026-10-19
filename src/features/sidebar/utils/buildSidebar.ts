import { NAV_GROUP_IDS, NAV_ITEMS, type NavItem } from "@components/layout/navigation";
import type { Role } from "@models/enums";
import type { SidebarGroup, SidebarSettings } from "../services/sidebarSettingsService";

// "Frequently used": pages opened at least this often, most used first
export const FREQUENT_MIN_VISITS = 3;
export const FREQUENT_LIMIT = 3;
export const RECENT_LIMIT = 3;

export interface SidebarGroupModel {
  id: string;
  name: string | null; // null = built-in, show t(`sidebar.groups.${id}`)
  collapsed: boolean;
  items: NavItem[];
}

export interface SidebarModel {
  favorites: NavItem[];
  frequent: NavItem[];
  recent: NavItem[];
  groups: SidebarGroupModel[];
}

export const DEFAULT_GROUPS: SidebarGroup[] = NAV_GROUP_IDS.map((id) => ({
  id,
  name: null,
  collapsed: false,
  items: NAV_ITEMS.filter((item) => item.group === id).map((item) => item.key),
}));

// Saved settings + the user's role → what the sidebar shows. Saved keys the
// role can't see (or that no longer exist) are skipped; pages that are not
// in any saved group (new pages, role change) go to their built-in group,
// or to the first group if the user deleted that one.
export function buildSidebar(
  settings: SidebarSettings,
  role: Role,
  activeKey: string | undefined,
): SidebarModel {
  const visible = new Map(
    NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => [item.key, item]),
  );
  const pick = (keys: string[]) =>
    keys.flatMap((key) => {
      const item = visible.get(key);
      return item ? [item] : [];
    });

  const placed = new Set<string>();
  const groups: SidebarGroupModel[] = (settings.groups ?? DEFAULT_GROUPS).map(
    (group) => ({
      ...group,
      items: pick(group.items.filter((key) => !placed.has(key) && placed.add(key))),
    }),
  );
  for (const item of visible.values()) {
    if (placed.has(item.key)) continue;
    const target = groups.find((group) => group.id === item.group) ?? groups[0];
    if (target) target.items.push(item);
    else groups.push({ id: item.group, name: null, collapsed: false, items: [item] });
  }

  const favorites = pick(settings.favorites);
  const taken = new Set(favorites.map((item) => item.key));
  const visits = settings.pageVisits;

  const frequent = [...visible.values()]
    .filter(
      (item) =>
        !taken.has(item.key) && (visits[item.key]?.count ?? 0) >= FREQUENT_MIN_VISITS,
    )
    .sort((a, b) => visits[b.key].count - visits[a.key].count)
    .slice(0, settings.showFrequent ? FREQUENT_LIMIT : 0);
  frequent.forEach((item) => taken.add(item.key));

  // The page the user is on is not a "quick jump"
  const recent = [...visible.values()]
    .filter((item) => !taken.has(item.key) && item.key !== activeKey && visits[item.key])
    .sort((a, b) =>
      visits[b.key].lastVisitedAt.localeCompare(visits[a.key].lastVisitedAt),
    )
    .slice(0, settings.showRecent ? RECENT_LIMIT : 0);

  return {
    favorites,
    frequent,
    recent,
    // An empty built-in group only means "nothing for this role" — hide it;
    // an empty group the user created stays visible as a drop target
    groups: groups.filter((group) => group.items.length > 0 || group.name !== null),
  };
}

// Model → what is stored (only the pages this user sees)
export function toSavedGroups(groups: SidebarGroupModel[]): SidebarGroup[] {
  return groups.map(({ id, name, collapsed, items }) => ({
    id,
    name,
    collapsed,
    items: items.map((item) => item.key),
  }));
}
