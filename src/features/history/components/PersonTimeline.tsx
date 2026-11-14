import { Segmented } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { listPersonHistory, listUserActivity } from "../services/historyService";
import { HistoryTimeline } from "./HistoryTimeline";

type Mode = "about" | "activity";

// One person's history: what happened to them, or what they did
export function PersonTimeline({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("about");

  return (
    <HistoryTimeline
      queryKey={["person", mode, userId]}
      fetchPage={(page, limit) =>
        (mode === "about" ? listPersonHistory : listUserActivity)(userId, {
          page,
          limit,
        })
      }
      title={t("staffDetail.history.title")}
      hint={t(`staffDetail.history.${mode}Hint`)}
      emptyTitle={t(`staffDetail.history.${mode}Empty`)}
      extra={
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "about", label: t("staffDetail.history.about") },
            { value: "activity", label: t("staffDetail.history.activity") },
          ]}
        />
      }
    />
  );
}
