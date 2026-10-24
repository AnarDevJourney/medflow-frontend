import { ClearOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

// Next to a list's filters: resets all of them at once. Shown only while
// some filter is applied, so an unfiltered toolbar stays quiet.
export function ClearFiltersButton({
  active,
  onClear,
}: {
  active: boolean;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  if (!active) return null;
  return (
    <Button type="text" icon={<ClearOutlined />} onClick={onClear}>
      {t("common.clearFilters")}
    </Button>
  );
}
