import { EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import {
  DetailDrawer,
  DetailHeader,
  DetailList,
  DetailSection,
} from "@components/drawer";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useLastDefined } from "@hooks/useLastDefined";
import { formatDateTime, fromNow } from "@lib/dayjs";
import type { StaffUser } from "../services/usersService";

// Read-only view of one account; "Edit" (users.update) hands over to UserModal.
// TODO(phase 5): department, title, schedule from staff-service.
export function StaffDetailDrawer({
  user: selected,
  onClose,
  onEdit,
}: {
  user: StaffUser | null;
  onClose: () => void;
  onEdit?: (user: StaffUser) => void;
}) {
  const { t } = useTranslation();
  const user = useLastDefined(selected);

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("staff.detailsTitle")}
      actions={
        user && (
          <>
            <Button onClick={onClose}>{t("common.close")}</Button>
            {onEdit && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(user)}>
                {t("staff.edit")}
              </Button>
            )}
          </>
        )
      }
    >
      {user && (
        <>
          <DetailHeader
            media={
              <UserAvatar firstName={user.firstName} lastName={user.lastName} size={56} />
            }
            title={`${user.firstName} ${user.lastName}`}
            subtitle={user.email}
          />
          <DetailSection title={t("staff.accountSection")}>
            <DetailList
              items={[
                { label: t("staff.role"), value: <RoleTag role={user.role} /> },
                {
                  label: t("staff.columns.status"),
                  value: <UserStatusTag status={user.status} />,
                },
              ]}
            />
          </DetailSection>
          <DetailSection title={t("staff.activitySection")}>
            <DetailList
              items={[
                { label: t("staff.createdAt"), value: formatDateTime(user.createdAt) },
                {
                  label: t("staff.lastLogin"),
                  value: user.lastLoginAt
                    ? `${formatDateTime(user.lastLoginAt)} · ${fromNow(user.lastLoginAt)}`
                    : t("staff.never"),
                },
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
