import { DatePicker } from "antd";
import { useTranslation } from "react-i18next";
import type { DayRange } from "@utils/dayRange";

// From / to days of a list filter (clinic days, see rangeToIso)
export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DayRange;
  onChange: (range: DayRange) => void;
}) {
  const { t } = useTranslation();
  return (
    <DatePicker.RangePicker
      allowEmpty={[true, true]}
      format="DD.MM.YYYY"
      placeholder={[t("common.from"), t("common.to")]}
      value={value}
      onChange={(dates) => onChange(dates as DayRange)}
      aria-label={t("common.period")}
    />
  );
}
