import { useTranslation } from "react-i18next";
import { PageHeader } from "@components/ui/PageHeader";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { PersonalInfoCard } from "../components/PersonalInfoCard";
import { PreferencesCard } from "../components/PreferencesCard";
import styles from "./ProfilePage.module.css";

// Own account: name, password, language and appearance (avatar: phase 10)
export function ProfilePage() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className={styles.page}>
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <div className={styles.layout}>
        <aside className={styles.identity}>
          <UserAvatar firstName={user.firstName} lastName={user.lastName} size={72} />
          <div className={styles.name}>
            {user.firstName} {user.lastName}
          </div>
          <div className={styles.email}>{user.email}</div>
          <RoleTag role={user.role} />
        </aside>
        <div className={styles.cards}>
          <PersonalInfoCard user={user} />
          <ChangePasswordCard />
          <PreferencesCard />
        </div>
      </div>
    </div>
  );
}
