import { useTranslation } from "react-i18next";
import { formatDay } from "@lib/dayjs";
import { useTimeOff } from "../hooks/useTimeOff";
import { formatPeriod, isCurrent } from "../utils/timeOff";
import { TimeOffTypeTag } from "./TimeOffTypeTag";
import styles from "./TimeOff.module.css";

// One line: "on vacation until 29 Jul" now, or the next period. Nothing
// when there is none. The caller checks the viewer may see it.
export function TimeOffStatus({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const next = useTimeOff({ userId, scope: "upcoming", sort: "startDate:asc", limit: 1 });
  const item = next.data?.items[0];
  if (!item) return null;

  return (
    <div className={styles.status}>
      <TimeOffTypeTag type={item.type} />
      <span className={styles.statusText}>
        {isCurrent(item)
          ? t("timeOff.awayUntil", { date: formatDay(item.endDate) })
          : t("timeOff.nextPeriod", {
              period: formatPeriod(item.startDate, item.endDate),
            })}
      </span>
    </div>
  );
}
