import { Select, type SelectProps } from "antd";
import { useTranslation } from "react-i18next";
import { ALL_ROLES, type Role } from "@models/enums";

export function RoleSelect(props: SelectProps<Role>) {
  const { t } = useTranslation();
  return (
    <Select<Role>
      {...props}
      options={ALL_ROLES.map((role) => ({ value: role, label: t(`roles.${role}`) }))}
    />
  );
}
