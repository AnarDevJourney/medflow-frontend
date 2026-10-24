import { api } from "@lib/api/client";

export interface SidebarGroup {
  id: string;
  name: string | null; // null = built-in group, translated title
  collapsed: boolean;
  items: string[]; // nav keys in display order
}

export interface PageVisit {
  count: number;
  lastVisitedAt: string;
}

export type SidebarPosition = "left" | "right";

// configurations-service: one row per user, created on the first change
export interface SidebarSettings {
  collapsed: boolean;
  position: SidebarPosition; // side of the screen
  groups: SidebarGroup[] | null; // null = default grouping
  favorites: string[];
  showFrequent: boolean;
  showRecent: boolean;
  pageVisits: Record<string, PageVisit>;
  updatedAt: string | null;
}

export type SidebarSettingsPatch = Partial<
  Pick<
    SidebarSettings,
    | "collapsed"
    | "position"
    | "groups"
    | "favorites"
    | "showFrequent"
    | "showRecent"
  >
>;

const URL = "/configurations/sidebar";

export async function getSidebarSettings(): Promise<SidebarSettings> {
  const { data } = await api.get<SidebarSettings>(URL);
  return data;
}

// Only the sent fields change on the server
export async function updateSidebarSettings(
  patch: SidebarSettingsPatch,
): Promise<SidebarSettings> {
  const { data } = await api.patch<SidebarSettings>(URL, patch);
  return data;
}

export async function recordPageVisit(pageKey: string): Promise<void> {
  await api.post(`${URL}/visits`, { pageKey });
}

export async function clearPageVisits(): Promise<void> {
  await api.delete(`${URL}/visits`);
}
