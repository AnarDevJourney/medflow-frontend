import type { CSSProperties } from "react";
import type { BuiltTheme } from "@lib/theme/buildTheme";
import styles from "./AppPreview.module.css";

// A miniature MedFlow window (sidebar, top bar, a card with a primary
// button) painted with one built theme — every option card in the
// appearance drawer shows exactly what it will look like.
export function AppPreview({
  theme,
  className,
}: {
  theme: BuiltTheme;
  className?: string;
}) {
  const { surfaces: s, sidebar, primary } = theme;
  const vars = {
    "--p-bg": s.bg,
    "--p-card": s.card,
    "--p-border": s.border,
    "--p-text": s.text,
    "--p-muted": s.muted,
    "--p-primary": primary,
    "--p-side-bg": sidebar.bg,
    "--p-side-text": sidebar.text,
    "--p-side-muted": sidebar.muted,
    "--p-side-active-bg": sidebar.activeBg,
    "--p-side-active-text": sidebar.activeText,
    "--p-side-border": sidebar.border,
    "--p-side-brand": sidebar.brand,
  } as CSSProperties;

  return (
    <div
      className={[styles.preview, className].filter(Boolean).join(" ")}
      style={vars}
      aria-hidden="true"
    >
      <div className={styles.side}>
        <span className={styles.brand} />
        <span className={`${styles.nav} ${styles.navActive}`} />
        <span className={styles.nav} />
        <span className={styles.nav} />
        <span className={styles.nav} />
      </div>
      <div className={styles.main}>
        <div className={styles.top} />
        <div className={styles.card}>
          <span className={styles.title} />
          <span className={styles.line} />
          <span className={styles.lineShort} />
          <span className={styles.button} />
        </div>
      </div>
    </div>
  );
}
