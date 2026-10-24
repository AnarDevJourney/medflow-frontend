import { useHistoryText } from "../hooks/useHistoryText";
import styles from "./History.module.css";

// Readable event name; the technical id ('user.invited') on hover
export function EventTypeTag({ value }: { value: string }) {
  const { eventLabel } = useHistoryText();
  return (
    <span className={styles.event} title={value}>
      {eventLabel(value)}
    </span>
  );
}
