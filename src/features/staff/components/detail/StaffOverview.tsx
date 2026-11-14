import {
  IdcardOutlined,
  MailOutlined,
  ReadOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { DetailList } from "@components/drawer";
import { RoleTag } from "@components/ui/RoleTag";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { formatDateTime, formatDay, fromNow } from "@lib/dayjs";
import type { StaffUser } from "../../services/usersService";
import type { StaffMember } from "../../services/staffService";
import { InfoCard, detailStyles as styles } from "@components/detail-page";

// Work profile, contacts, bio and (users.read) the account
export function StaffOverview({
  staff,
  account,
  showAccount,
}: {
  staff: StaffMember;
  account: StaffUser | undefined;
  showAccount: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={styles.overview}>
      <div className={styles.column}>
        <InfoCard icon={<IdcardOutlined />} title={t("staff.profile.workSection")}>
          <DetailList
            items={[
              {
                label: t("staff.profile.department"),
                value: staff.department && (
                  <span>
                    {staff.department.name}
                    {!staff.department.isActive && (
                      <span className={styles.muted}>
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
        </InfoCard>
        <InfoCard icon={<ReadOutlined />} title={t("staff.profile.bio")}>
          {staff.bio ? (
            <p className={styles.bio}>{staff.bio}</p>
          ) : (
            <p className={styles.placeholder}>{t("staffDetail.noBio")}</p>
          )}
        </InfoCard>
      </div>

      <div className={styles.column}>
        <InfoCard icon={<MailOutlined />} title={t("staff.profile.contactSection")}>
          <DetailList
            items={[
              {
                label: t("auth.email"),
                value: (
                  <a href={`mailto:${staff.email}`} className={styles.link}>
                    {staff.email}
                  </a>
                ),
              },
              {
                label: t("staff.profile.phone"),
                value: staff.phone && (
                  <a href={`tel:${staff.phone}`} className={styles.link}>
                    {staff.phone}
                  </a>
                ),
              },
            ]}
          />
        </InfoCard>
        {showAccount && (
          <InfoCard icon={<SafetyOutlined />} title={t("staff.accountSection")}>
            <DetailList
              items={[
                {
                  label: t("staff.columns.status"),
                  value: <UserStatusTag status={staff.status} />,
                },
                { label: t("staff.role"), value: <RoleTag role={staff.role} /> },
                {
                  label: t("staffDetail.addedAt"),
                  value: formatDateTime(account?.createdAt ?? staff.createdAt),
                },
                {
                  label: t("staff.lastLogin"),
                  value: !account
                    ? null
                    : account.lastLoginAt
                      ? `${formatDateTime(account.lastLoginAt)} · ${fromNow(account.lastLoginAt)}`
                      : t("staff.never"),
                },
              ]}
            />
          </InfoCard>
        )}
      </div>
    </div>
  );
}
