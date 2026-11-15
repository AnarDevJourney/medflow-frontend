import type { ReactNode } from "react";
import styles from "./ShareBars.module.css";

export interface ShareRow {
  key: string;
  label: ReactNode;
  count: number;
}

// Labeled horizontal bars in one hue, the value and share printed beside
// each, so nothing is read from color alone. Bars grow in on first paint
// (off when the user's motion setting is reduced).
export function ShareBars({
  title,
  rows,
  showShare = true,
}: {
  title: string;
  rows: ShareRow[];
  // false when the rows are a top-N, not the whole (the % would mislead)
  showShare?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <section className={styles.shares}>
      <h3 className={styles.subheading}>{title}</h3>
      <ul className={styles.shareList}>
        {rows.map((row, index) => {
          const share = total ? Math.round((row.count / total) * 100) : 0;
          return (
            <li key={row.key} className={styles.shareRow}>
              <span className={styles.shareLabel}>{row.label}</span>
              <span className={styles.shareTrack} aria-hidden="true">
                <span
                  className={styles.shareFill}
                  style={{
                    width: `${(row.count / max) * 100}%`,
                    animationDelay: `${100 + index * 60}ms`,
                  }}
                />
              </span>
              <span className={styles.shareValue}>
                {row.count.toLocaleString()}
                {showShare && <span className={styles.shareSub}> · {share}%</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
