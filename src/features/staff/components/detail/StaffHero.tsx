import {
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { useConfirmUserAction } from "../../hooks/useConfirmUserAction";
import type { StaffMember } from "../../services/staffService";
import styles from "./StaffDetail.module.css";

export interface HeroFact {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "success" | "warning" | "muted";
}

// Who this is and the few facts people look for first; the actions the
// viewer may take on the account and the work profile
export function StaffHero({
  staff,
  isMe,
  facts,
  onEditProfile,
  onEditAccount,
}: {
  staff: StaffMember;
  isMe: boolean;
  facts: HeroFact[];
  onEditProfile?: () => void;
  onEditAccount?: () => void;
}) {
  const { t } = useTranslation();
  const can = useCan();
  const { resend, deactivate, reactivate } = useConfirmUserAction();
  const account = { ...staff, id: staff.userId };

  const menu: NonNullable<MenuProps["items"]> = [];
  if (can("users.invite") && staff.status === "INVITED") {
    menu.push({
      key: "resend",
      icon: <MailOutlined />,
      label: t("staff.resendInvite"),
      onClick: () => resend(account),
    });
  }
  if (can("users.deactivate")) {
    menu.push(
      staff.status === "DEACTIVATED"
        ? {
            key: "reactivate",
            icon: <UndoOutlined />,
            label: t("staff.reactivate"),
            onClick: () => reactivate(account),
          }
        : {
            key: "deactivate",
            icon: <StopOutlined />,
            label: t("staff.deactivate"),
            danger: true,
            disabled: isMe,
            onClick: () => deactivate(account),
          },
    );
  }

  const subtitle = [staff.title, staff.department?.name].filter(Boolean).join(" · ");

  return (
    <section className={styles.hero}>
      <div className={styles.heroBand} aria-hidden="true" />
      <div className={styles.heroBody}>
        <div className={styles.heroAvatar}>
          <UserAvatar firstName={staff.firstName} lastName={staff.lastName} size={88} />
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroName}>
            {staff.firstName} {staff.lastName}
            {isMe && <span className={styles.you}>{t("staff.you")}</span>}
          </h1>
          {subtitle && <p className={styles.heroSub}>{subtitle}</p>}
          <div className={styles.heroTags}>
            <RoleTag role={staff.role} />
            {can("users.read") && <UserStatusTag status={staff.status} />}
          </div>
          <div className={styles.contacts}>
            <a href={`mailto:${staff.email}`} className={styles.contact}>
              <MailOutlined aria-hidden="true" />
              {staff.email}
            </a>
            {staff.phone && (
              <a href={`tel:${staff.phone}`} className={styles.contact}>
                <PhoneOutlined aria-hidden="true" />
                {staff.phone}
              </a>
            )}
          </div>
        </div>
        {(onEditProfile || onEditAccount || menu.length > 0) && (
          <div className={styles.heroActions}>
            {onEditAccount && (
              <Button icon={<EditOutlined />} onClick={onEditAccount}>
                {t("staff.editAccount")}
              </Button>
            )}
            {onEditProfile && (
              <Button type="primary" icon={<IdcardOutlined />} onClick={onEditProfile}>
                {t("staff.editProfile")}
              </Button>
            )}
            {menu.length > 0 && (
              <Dropdown
                menu={{ items: menu }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  icon={<MoreOutlined />}
                  aria-label={t("staffDetail.moreActions")}
                />
              </Dropdown>
            )}
          </div>
        )}
      </div>

      {facts.length > 0 && (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.key} className={styles.fact}>
              <dt>
                <span className={styles.factIcon} aria-hidden="true">
                  {fact.icon}
                </span>
                {fact.label}
              </dt>
              <dd>
                <span className={styles.factValue} data-tone={fact.tone}>
                  {fact.value}
                </span>
                {fact.sub && <span className={styles.factSub}>{fact.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
