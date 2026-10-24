import { Skeleton } from "antd";
import styles from "./AppSplash.module.css";

// While the signed-in user is being loaded: the shape of the app shell
// (sidebar, top bar, page) instead of a spinner — no layout jump after
export function AppSplash() {
  return (
    <div className={styles.splash} aria-busy="true">
      <aside className={styles.side}>
        <Skeleton.Button active size="small" className={styles.brand} />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton.Button key={i} active block size="small" />
        ))}
      </aside>
      <div className={styles.main}>
        <div className={styles.top} />
        <div className={styles.content}>
          <Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 360 }} />
          <div className={styles.card}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
