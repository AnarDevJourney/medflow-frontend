import { EditOutlined, IdcardOutlined } from "@ant-design/icons";
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
import { formatDateTime, formatDay, fromNow } from "@lib/dayjs";
import { useUser } from "../hooks/useUsers";
import type { StaffMember } from "../services/staffService";
import styles from "./StaffModals.module.css";

// Read-only view of one person. "Edit profile" (staff.update) opens
// StaffProfileModal, "Edit account" (users.update) opens UserModal. The last
// sign-in comes from auth-service, only for users.read.
// TODO(phase 5.3): weekly schedule for doctors.
export function StaffDetailDrawer({
  staff: selected,
  canReadAccount,
  onClose,
  onEditProfile,
  onEditAccount,
}: {
  staff: StaffMember | null;
  canReadAccount: boolean;
  onClose: () => void;
  onEditProfile?: (staff: StaffMember) => void;
  onEditAccount?: (staff: StaffMember) => void;
}) {
  const { t } = useTranslation();
  const staff = useLastDefined(selected);
  const account = useUser(selected?.userId ?? null, canReadAccount);
  const lastLoginAt = account.data?.lastLoginAt;

  return (
    <DetailDrawer
      open={Boolean(selected)}
      onClose={onClose}
      title={t("staff.detailsTitle")}
      actions={
        staff && (
          <>
            <Button onClick={onClose}>{t("common.close")}</Button>
            {onEditAccount && (
              <Button icon={<EditOutlined />} onClick={() => onEditAccount(staff)}>
                {t("staff.editAccount")}
              </Button>
            )}
            {onEditProfile && (
              <Button
                type="primary"
                icon={<IdcardOutlined />}
                onClick={() => onEditProfile(staff)}
              >
                {t("staff.editProfile")}
              </Button>
            )}
          </>
        )
      }
    >
      {staff && (
        <>
          <DetailHeader
            media={
              <UserAvatar
                firstName={staff.firstName}
                lastName={staff.lastName}
                size={56}
              />
            }
            title={`${staff.firstName} ${staff.lastName}`}
            subtitle={staff.title ?? staff.email}
            tags={
              <>
                <RoleTag role={staff.role} />
                {canReadAccount && <UserStatusTag status={staff.status} />}
              </>
            }
          />
          <DetailSection title={t("staff.profile.workSection")}>
            <DetailList
              items={[
                {
                  label: t("staff.profile.department"),
                  value: staff.department && (
                    <span>
                      {staff.department.name}
                      {!staff.department.isActive && (
                        <span className={styles.inactiveNote}>
                          {" "}
                          · {t("departments.status.inactive")}
                        </span>
                      )}
                    </span>
                  ),
                },
                { label: t("staff.profile.title"), value: staff.title },
                { label: t("staff.profile.specialization"), value: staff.specialization },
                { label: t("staff.profile.licenseNumber"), value: staff.licenseNumber },
                {
                  label: t("staff.profile.hireDate"),
                  value: staff.hireDate && formatDay(staff.hireDate),
                },
              ]}
            />
          </DetailSection>
          <DetailSection title={t("staff.profile.contactSection")}>
            <DetailList
              items={[
                { label: t("auth.email"), value: staff.email },
                { label: t("staff.profile.phone"), value: staff.phone },
              ]}
            />
          </DetailSection>
          {staff.bio && (
            <DetailSection title={t("staff.profile.bio")}>
              <p className={styles.bio}>{staff.bio}</p>
            </DetailSection>
          )}
          <DetailSection title={t("staff.activitySection")}>
            <DetailList
              items={[
                { label: t("staff.createdAt"), value: formatDateTime(staff.createdAt) },
                ...(canReadAccount
                  ? [
                      {
                        label: t("staff.lastLogin"),
                        value:
                          lastLoginAt === undefined
                            ? null
                            : lastLoginAt
                              ? `${formatDateTime(lastLoginAt)} · ${fromNow(lastLoginAt)}`
                              : t("staff.never"),
                      },
                    ]
                  : []),
              ]}
            />
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
