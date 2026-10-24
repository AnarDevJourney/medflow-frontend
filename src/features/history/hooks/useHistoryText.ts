import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HistoryEntry } from "../services/historyService";

// History rows in the reader's language. The backend stores a key + data
// params (names, role codes, field names); the sentence is built here from
// historyEvents.<key>. Rows written before keys existed keep the stored
// English summary.
export function useHistoryText() {
  const { t } = useTranslation();

  return useMemo(() => {
    const eventLabel = (eventType: string) =>
      t(`history.eventTypes.${eventType}`, { defaultValue: eventType });

    const summary = (
      entry: Pick<HistoryEntry, "summary" | "summaryKey" | "summaryParams">,
    ) => {
      if (!entry.summaryKey) return entry.summary;
      const p = entry.summaryParams;
      return t(`historyEvents.${entry.summaryKey}`, {
        ...p,
        actor: typeof p.actor === "string" ? p.actor : t("history.system"),
        role:
          typeof p.role === "string"
            ? t(`roles.${p.role}`, { defaultValue: p.role })
            : "",
        fields: Array.isArray(p.fields)
          ? p.fields
              .map((field) =>
                t(`history.fields.${field}`, { defaultValue: String(field) }),
              )
              .join(", ")
          : "",
        // a key this build doesn't know yet → the stored sentence
        defaultValue: entry.summary,
      });
    };

    return { eventLabel, summary };
  }, [t]);
}
