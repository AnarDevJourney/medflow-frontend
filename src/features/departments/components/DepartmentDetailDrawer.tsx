import { ClusterOutlined, EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
} from "@components/drawer";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime, fromNow } from "@lib/dayjs";
import type { Department } from "../services/departmentsService";
import { DepartmentStatusTag } from "./DepartmentStatusTag";
import styles from "../pages/DepartmentsPage.module.css";

// Read-only view of one department; "Edit" hands over to DepartmentModal
export function DepartmentDetailDrawer({
  department: selected,
  onClose,
  onEdit,
}: {
  department: Department | null;
  onClose: () => void;
  onEdit: (department: Department) => void;
}) {
  const { t } = useTranslation();
  const department = useLastDefined(selected);

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("departments.detailsTitle")}
      actions={
        department && (
          <>
            <Button onClick={onClose}>{t("common.close")}</Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(department)}
            >
              {t("departments.edit")}
            </Button>
          </>
        )
      }
    >
      {department && (
        <>
          <DetailHeader
            media={
              <span className={styles.drawerIcon} aria-hidden="true">
                <ClusterOutlined />
              </span>
            }
            title={department.name}
            subtitle={department.code}
            tags={<DepartmentStatusTag isActive={department.isActive} />}
          />
          <DetailSection title={t("departments.detailsSection")}>
            <DetailList
              items={[
                { label: t("departments.location"), value: department.location },
                { label: t("departments.phone"), value: department.phone },
                { label: t("departments.description"), value: department.description },
              ]}
            />
          </DetailSection>
          <DetailSection title={t("departments.activitySection")}>
            <DetailList
              items={[
                {
                  label: t("departments.columns.createdAt"),
                  value: formatDateTime(department.createdAt),
                },
                {
                  label: t("departments.updatedAt"),
                  value: `${formatDateTime(department.updatedAt)} · ${fromNow(department.updatedAt)}`,
                },
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
