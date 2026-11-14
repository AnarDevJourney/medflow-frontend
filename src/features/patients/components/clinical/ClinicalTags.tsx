import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  WarningFilled,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import tags from "@components/ui/Tags.module.css";
import type { ReactNode } from "react";
import type { AllergySeverity, ConditionStatus } from "@models/enums";

const SEVERITY_LOOK: Record<AllergySeverity, { className: string; icon: ReactNode }> = {
  SEVERE: { className: tags.danger, icon: <WarningFilled /> },
  MODERATE: { className: tags.warning, icon: <ExclamationCircleFilled /> },
  MILD: { className: tags.muted, icon: <InfoCircleFilled /> },
};

// Icon + text + color (never color alone)
export function AllergySeverityTag({ severity }: { severity: AllergySeverity }) {
  const { t } = useTranslation();
  const look = SEVERITY_LOOK[severity];
  return (
    <span className={`${tags.tag} ${look.className}`}>
      <span aria-hidden="true">{look.icon}</span>
      {t(`clinical.severity.${severity}`)}
    </span>
  );
}

export function ConditionStatusTag({ status }: { status: ConditionStatus }) {
  const { t } = useTranslation();
  const active = status === "ACTIVE";
  return (
    <span className={`${tags.tag} ${active ? tags.warning : tags.muted}`}>
      <span aria-hidden="true">
        {active ? <ExclamationCircleFilled /> : <CheckCircleFilled />}
      </span>
      {t(`clinical.conditionStatus.${status}`)}
    </span>
  );
}
