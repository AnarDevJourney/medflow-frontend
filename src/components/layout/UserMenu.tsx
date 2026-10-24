import {
  BgColorsOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { useSignOut } from "@features/auth/hooks/useAuthActions";
import type { CurrentUser } from "@features/auth/services/authService";
import { PATHS } from "@router/paths";
import styles from "./UserMenu.module.css";

// Top-bar account menu: who is signed in, profile, appearance, sign out
export function UserMenu({
  user,
  onAppearance,
}: {
  user: CurrentUser;
  onAppearance: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      popupRender={(menu) => (
        <div className={styles.popup}>
          <div className={styles.identity}>
            <UserAvatar firstName={user.firstName} lastName={user.lastName} size={40} />
            <div className={styles.identityText}>
              <span className={styles.name}>{name}</span>
              <span className={styles.email}>{user.email}</span>
              <RoleTag role={user.role} />
            </div>
          </div>
          {menu}
        </div>
      )}
      menu={{
        items: [
          { key: "profile", icon: <UserOutlined />, label: t("profile.title") },
          { key: "appearance", icon: <BgColorsOutlined />, label: t("appearance.title") },
          { type: "divider" },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: t("auth.logout"),
            danger: true,
          },
        ],
        onClick: ({ key }) => {
          if (key === "profile") void navigate(PATHS.profile);
          if (key === "appearance") onAppearance();
          if (key === "logout") void signOut();
        },
      }}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label={t("profile.menuLabel", { name })}
      >
        <UserAvatar firstName={user.firstName} lastName={user.lastName} size={32} />
        <span className={styles.triggerName}>{user.firstName}</span>
        <DownOutlined className={styles.chevron} />
      </button>
    </Dropdown>
  );
}
