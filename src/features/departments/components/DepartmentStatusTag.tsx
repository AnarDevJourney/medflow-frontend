import { CheckCircleFilled, StopFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import tags from "@components/ui/Tags.module.css";

// Icon + text + semantic color (never color alone)
export function DepartmentStatusTag({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={`${tags.tag} ${isActive ? tags.success : tags.muted}`}>
      <span aria-hidden="true">{isActive ? <CheckCircleFilled /> : <StopFilled />}</span>
      {t(isActive ? "departments.status.active" : "departments.status.inactive")}
    </span>
  );
}
