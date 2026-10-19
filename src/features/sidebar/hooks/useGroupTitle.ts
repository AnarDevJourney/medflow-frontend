import { useTranslation } from "react-i18next";
import type { SidebarGroupModel } from "../utils/buildSidebar";

// Own name, or the translated title of a built-in group
export function useGroupTitle() {
  const { t } = useTranslation();
  return (group: Pick<SidebarGroupModel, "id" | "name">) =>
    group.name ?? t(`sidebar.groups.${group.id}`, { defaultValue: group.id });
}
