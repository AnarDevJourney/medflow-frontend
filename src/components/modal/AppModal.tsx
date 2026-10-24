import { App, Button, Modal } from "antd";
import { useId, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AppModal.module.css";

export type ModalSize = "sm" | "md" | "lg" | "xl";
export type ModalTone = "default" | "danger" | "warning" | "success";

const WIDTH: Record<ModalSize, number> = { sm: 400, md: 520, lg: 720, xl: 960 };

// AntD paints the whole dialog in one padded container; we split it into
// three bands (header · scrolling body · footer). Passed as AntD `styles`
// (inline), because its own `.ant-modal .ant-modal-*` rules outrank a
// CSS-module class.
const SLOT_STYLES: Record<"container" | "header" | "body" | "footer", CSSProperties> = {
  container: { padding: 0, overflow: "hidden", borderRadius: "var(--radius-lg)" },
  header: {
    margin: 0,
    padding: "var(--space-6) 56px var(--space-4) var(--space-6)", // 56px: room for ✕
  },
  body: {
    maxHeight: "calc(100vh - 240px)",
    overflowY: "auto",
    padding: "var(--space-1) var(--space-6) var(--space-6)",
  },
  footer: {
    margin: 0,
    padding: "var(--space-3) var(--space-6)",
    borderTop: "1px solid var(--color-border)",
    background: "var(--color-bg)",
  },
};

export interface ModalAction {
  label: ReactNode;
  icon?: ReactNode;
  // Not needed with `onSubmit`: the primary action submits the form
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

export interface AppModalProps {
  open: boolean;
  // Every way of closing ends here: ✕, Esc, the mask, the cancel button
  onClose: () => void;
  title: ReactNode;
  // One or two lines under the title: what this dialog does
  description?: ReactNode;
  // Small tinted tile left of the title; `tone` picks its color
  icon?: ReactNode;
  tone?: ModalTone;
  // sm 400 · md 520 (default) · lg 720 · xl 960, or a width in px
  size?: ModalSize | number;
  children?: ReactNode;

  // ─── Footer ──────────────────────────────────────────────
  // The main button on the right
  primaryAction?: ModalAction;
  // Cancel button text; false hides it
  cancelText?: ReactNode | false;
  // Left side of the footer (a destructive action, a hint …)
  footerStart?: ReactNode;
  // Replaces the built-in footer entirely; null = no footer
  footer?: ReactNode | null;

  // ─── Forms ───────────────────────────────────────────────
  // The body becomes a <form>: Enter in a field and the primary button
  // both submit it (React Hook Form: pass handleSubmit(...))
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  // Unsaved changes: closing asks "Discard changes?" first
  dirty?: boolean;

  // ─── Closing ─────────────────────────────────────────────
  // false = no ✕ and no Esc; only the footer buttons close it
  closable?: boolean;
  // Click on the dark mask closes it. Default: true, but false for forms
  // (a stray click must not throw away what was typed)
  maskClosable?: boolean;
  // Called after the close animation (reset state here)
  afterClose?: () => void;
  className?: string;
}

// The one dialog of the app. Same header, spacing and footer everywhere;
// forms get Enter-to-submit, a guard against losing unsaved input, and
// no closing while the primary action is running.
export function AppModal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "default",
  size = "md",
  children,
  primaryAction,
  cancelText,
  footerStart,
  footer,
  onSubmit,
  dirty = false,
  closable = true,
  maskClosable,
  afterClose,
  className,
}: AppModalProps) {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const formId = useId();
  const busy = Boolean(primaryAction?.loading);

  const requestClose = () => {
    if (busy) return; // the request is still running
    if (!dirty) return onClose();
    modal.confirm({
      title: t("modal.discardTitle"),
      content: t("modal.discardText"),
      okText: t("modal.discard"),
      okButtonProps: { danger: true },
      cancelText: t("modal.keepEditing"),
      onOk: onClose,
    });
  };

  const builtInFooter = (primaryAction || cancelText !== false || footerStart) && (
    <div className={styles.footer}>
      <div className={styles.footerStart}>{footerStart}</div>
      {cancelText !== false && (
        <Button onClick={requestClose} disabled={busy}>
          {cancelText ?? t("common.cancel")}
        </Button>
      )}
      {primaryAction && (
        <Button
          type="primary"
          danger={primaryAction.danger}
          icon={primaryAction.icon}
          loading={primaryAction.loading}
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
          {...(onSubmit && { htmlType: "submit", form: formId })}
        >
          {primaryAction.label}
        </Button>
      )}
    </div>
  );

  const header = (
    <div className={styles.header}>
      {icon && (
        <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={styles.headerText}>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={requestClose}
      title={header}
      width={typeof size === "number" ? size : WIDTH[size]}
      footer={footer === undefined ? builtInFooter || null : footer}
      centered
      destroyOnHidden
      closable={closable && !busy}
      keyboard={closable && !busy}
      maskClosable={maskClosable ?? !onSubmit}
      afterClose={afterClose}
      className={className}
      styles={SLOT_STYLES}
    >
      {onSubmit ? (
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) onSubmit(event);
          }}
        >
          {children}
        </form>
      ) : (
        children
      )}
    </Modal>
  );
}
