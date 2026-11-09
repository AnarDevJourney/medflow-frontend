import { Select, type SelectProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useActiveDepartments } from "../hooks/useDepartments";

export interface DepartmentOptionRef {
  id: string;
  name: string;
  isActive: boolean;
}

// Active departments, searchable by name or code. `current` keeps an
// inactive department that is already assigned visible (disabled), so an
// edit form does not show a bare value.
export function DepartmentSelect({
  current,
  ...props
}: SelectProps<string> & { current?: DepartmentOptionRef | null }) {
  const { t } = useTranslation();
  const departments = useActiveDepartments();

  const options = useMemo(() => {
    const active = (departments.data ?? []).map((d) => ({
      value: d.id,
      label: d.name,
      search: `${d.name} ${d.code}`,
    }));
    if (current && !active.some((o) => o.value === current.id)) {
      active.push({
        value: current.id,
        label: `${current.name} (${t("departments.status.inactive")})`,
        search: current.name,
      });
    }
    return active.map((o) => ({
      ...o,
      disabled: current?.id === o.value && !current.isActive,
    }));
  }, [departments.data, current, t]);

  return (
    <Select<string>
      showSearch={{ optionFilterProp: "search" }}
      loading={departments.isLoading}
      options={options}
      notFoundContent={t("departments.noneFound")}
      {...props}
    />
  );
}
