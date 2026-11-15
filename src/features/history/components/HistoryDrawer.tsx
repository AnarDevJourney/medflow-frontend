import { SettingOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
  type DetailItem,
} from "@components/drawer";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime, formatDay, fromNow } from "@lib/dayjs";
import type { Role, UserStatus } from "@models/enums";
import { TimeOffTypeTag } from "@features/schedules/components/TimeOffTypeTag";
import type { TimeOffType } from "@features/schedules/services/timeOffService";
import { useHistoryText } from "../hooks/useHistoryText";
import { eventLook } from "./eventLook";
import type { HistoryEntry } from "../services/historyService";
import styles from "./History.module.css";

// Ids are never shown (they mean nothing to a reader)
const isIdKey = (key: string) => /id$/i.test(key);

// Everything recorded about one action, in words: no ids, no raw JSON
// (the log is append-only, so this is read-only)
export function HistoryDrawer({
  entry: selected,
  onClose,
}: {
  entry: HistoryEntry | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { eventLabel, summary, permissionLabel } = useHistoryText();
  const entry = useLastDefined(selected);

  // metadata key → readable row; unknown keys get a humanized label
  const metadataItem = (key: string, value: unknown): DetailItem | null => {
    if (value == null || value === "" || isIdKey(key)) return null;
    switch (key) {
      case "email":
        return { label: t("auth.email"), value: String(value) };
      case "role":
        return { label: t("staff.role"), value: <RoleTag role={value as Role} /> };
      case "status":
        return {
          label: t("staff.columns.status"),
          value: <UserStatusTag status={value as UserStatus} />,
        };
      case "title":
        return { label: t("history.meta.title"), value: String(value) };
      case "changedFields":
        return Array.isArray(value) && value.length > 0
          ? {
              label: t("history.meta.changedFields"),
              value: value
                .map((field) =>
                  t(`history.fields.${String(field)}`, { defaultValue: String(field) }),
                )
                .join(", "),
            }
          : null;
      case "changedDays":
        return Array.isArray(value) && value.length > 0
          ? {
              label: t("history.meta.changedDays"),
              value: value.map((day) => t(`weekdays.long.${String(day)}`)).join(", "),
            }
          : null;
      case "type":
        return {
          label: t("timeOff.type"),
          value: <TimeOffTypeTag type={value as TimeOffType} />,
        };
      case "startDate":
      case "endDate":
        return { label: t(`history.meta.${key}`), value: formatDay(String(value)) };
      case "days":
        return { label: t("history.meta.days"), value: String(value) };
      case "workingDays":
        return { label: t("history.meta.workingDays"), value: String(value) };
      case "added":
      case "removed":
        return Array.isArray(value) && value.length > 0
          ? {
              label: t(`history.meta.${key}`),
              value: value.map(permissionLabel).join(", "),
            }
          : null;
      case "resent":
        return {
          label: t("history.meta.invitation"),
          value: t(value ? "history.meta.resent" : "history.meta.firstInvite"),
        };
      case "via":
        return {
          label: t("history.meta.via"),
          value: t(`history.via.${String(value)}`, { defaultValue: String(value) }),
        };
      case "cancellationReason":
        return {
          label: t("history.meta.cancellationReason"),
          value: t(`appointments.systemReasons.${String(value)}`, {
            defaultValue: String(value),
          }),
        };
      case "doctorName":
      case "previousDoctorName":
      case "departmentName":
        return { label: t(`history.meta.${key}`), value: String(value) };
      case "previousStartsAt":
        return {
          label: t("history.meta.previousStartsAt"),
          value: formatDateTime(String(value)),
        };
      case "startsAt":
        return {
          label: t("history.meta.startsAt"),
          value: formatDateTime(String(value)),
        };
      case "appointmentType":
        return {
          label: t("history.meta.appointmentType"),
          value: t(`appointments.types.${String(value)}`, {
            defaultValue: String(value),
          }),
        };
      case "reason":
        return {
          label: t("history.meta.reason"),
          value: t(`history.reasons.${String(value)}`, { defaultValue: String(value) }),
        };
      default:
        return typeof value === "string" || typeof value === "number"
          ? {
              label: t(`history.meta.${key}`, { defaultValue: key }),
              value: String(value),
            }
          : null;
    }
  };

  const look = eventLook(entry?.eventType ?? "");
  const subject =
    entry &&
    (typeof entry.summaryParams.name === "string"
      ? entry.summaryParams.name
      : typeof entry.summaryParams.email === "string"
        ? entry.summaryParams.email
        : null);
  const details: DetailItem[] = entry
    ? [
        {
          label: t("history.columns.entity"),
          value: [
            t(`history.entities.${entry.entityType}`, { defaultValue: entry.entityType }),
            subject,
          ]
            .filter(Boolean)
            .join(" · "),
        },
        ...Object.entries(entry.metadata)
          .map(([key, value]) => metadataItem(key, value))
          .filter((item): item is DetailItem => item !== null),
      ]
    : [];

  const [actorFirst = "", ...actorRest] = entry?.actor?.name.split(" ") ?? [];

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("history.detailsTitle")}
      actions={<Button onClick={onClose}>{t("common.close")}</Button>}
    >
      {entry && (
        <>
          <DetailHeader
            media={
              <span
                className={`${styles.eventIcon} ${styles[look.tone]}`}
                aria-hidden="true"
              >
                {look.icon}
              </span>
            }
            title={eventLabel(entry.eventType)}
            subtitle={`${formatDateTime(entry.occurredAt)} · ${fromNow(entry.occurredAt)}`}
          />

          <p className={`${styles.summaryCard} ${styles[look.tone]}`}>{summary(entry)}</p>

          <DetailSection title={t("history.actorSection")}>
            <div className={styles.actorCard}>
              {entry.actor ? (
                <>
                  <UserAvatar
                    firstName={actorFirst}
                    lastName={actorRest.join(" ")}
                    size={40}
                  />
                  <div className={styles.actorText}>
                    <span className={styles.actorName}>{entry.actor.name}</span>
                    <RoleTag role={entry.actor.role as Role} />
                  </div>
                </>
              ) : (
                <>
                  <span
                    className={`${styles.eventIcon} ${styles.system}`}
                    aria-hidden="true"
                  >
                    <SettingOutlined />
                  </span>
                  <div className={styles.actorText}>
                    <span className={styles.actorName}>{t("history.system")}</span>
                    <span className={styles.muted}>{t("history.systemHint")}</span>
                  </div>
                </>
              )}
            </div>
          </DetailSection>

          <DetailSection title={t("history.detailsSection")}>
            <DetailList items={details} />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
