// dnd-kit ids must be unique across all sortable lists of the sidebar
export const groupDndId = (id: string) => `group:${id}`;
export const itemDndId = (key: string) => `item:${key}`;
export const favDndId = (key: string) => `fav:${key}`;

export const keyOf = (dndId: string) => dndId.slice(dndId.indexOf(":") + 1);
export const isGroupId = (dndId: string) => dndId.startsWith("group:");
export const isItemId = (dndId: string) => dndId.startsWith("item:");
