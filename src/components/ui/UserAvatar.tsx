import { Avatar } from "antd";
import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

// Initials avatar (photos come with file-service, phase 10)
export function UserAvatar({ firstName, lastName, size = 32 }: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase("az");
  return (
    <Avatar
      size={size}
      className={styles.avatar}
      style={{ fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </Avatar>
  );
}
