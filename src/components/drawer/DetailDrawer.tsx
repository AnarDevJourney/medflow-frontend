import { Drawer } from "antd";
import type { ReactNode } from "react";
import styles from "./DetailDrawer.module.css";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  // Drawer bar title: what kind of record this is ("Staff member", "Invoice")
  title: ReactNode;
  // Footer buttons, right-aligned (e.g. Close + Edit)
  actions?: ReactNode;
  size?: number;
  children?: ReactNode;
}

// Read-only view of one record, opened from a list without leaving the
// page. Build the content from DetailHeader, DetailSection and DetailList
// so every record type looks the same; editing happens in an AppModal.
export function DetailDrawer({
  open,
  onClose,
  title,
  actions,
  size = 480,
  children,
}: DetailDrawerProps) {
  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      size={size}
      destroyOnHidden
      footer={actions && <div className={styles.footer}>{actions}</div>}
    >
      {children}
    </Drawer>
  );
}

// Who / what this is: avatar or icon, name, a secondary line, tags
export function DetailHeader({
  media,
  title,
  subtitle,
  tags,
}: {
  media?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tags?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      {media}
      <div className={styles.headerText}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {tags && <div className={styles.tags}>{tags}</div>}
      </div>
    </div>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

export interface DetailItem {
  label: ReactNode;
  value: ReactNode;
}

// Label → value rows; empty values show a muted dash
export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className={styles.list}>
      {items.map((item, index) => (
        <div key={index} className={styles.item}>
          <dt>{item.label}</dt>
          <dd>
            {item.value ?? <span className={styles.empty}>—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
