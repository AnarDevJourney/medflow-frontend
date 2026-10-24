import { MailOutlined, StopOutlined, UndoOutlined } from "@ant-design/icons";
import { App, Button, Form, Input } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { UserStatusTag } from "@components/ui/UserStatusTag";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { applyFieldErrors } from "@lib/api/formErrors";
import { formatDateTime } from "@lib/dayjs";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import type { Role } from "@models/enums";
import { useConfirmUserAction } from "../hooks/useConfirmUserAction";
import type { StaffUser } from "../services/usersService";
import { RoleSelect } from "./RoleSelect";
import styles from "./StaffModals.module.css";

interface EditValues {
  firstName: string;
  lastName: string;
  role: Role;
}

// One account: facts, edit name / role, and the status actions
export function UserModal({
  user: selected,
  onClose,
}: {
  user: StaffUser | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { data: me } = useCurrentUser();
  // The last opened user stays rendered while the modal animates out
  const [user, setUser] = useState(selected);
  if (selected && selected !== user) setUser(selected);
  const confirm = useConfirmUserAction();
  const isSelf = user?.id === me?.id;

  const { control, handleSubmit, formState, reset, setError } = useForm<EditValues>({
    mode: "onSubmit",
    values: user
      ? { firstName: user.firstName, lastName: user.lastName, role: user.role }
      : undefined,
  });

  const save = handleSubmit((v) => {
    if (!user) return;
    // only what changed; email is the login and is not editable
    const input = {
      ...(v.firstName.trim() !== user.firstName && { firstName: v.firstName.trim() }),
      ...(v.lastName.trim() !== user.lastName && { lastName: v.lastName.trim() }),
      ...(v.role !== user.role && { role: v.role }),
    };
    confirm.actions.update.mutate(
      { id: user.id, input },
      {
        onSuccess: (updated) => {
          reset({
            firstName: updated.firstName,
            lastName: updated.lastName,
            role: updated.role,
          });
          void message.success(t("staff.saved"));
          onClose();
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
        },
      },
    );
  });

  const required = {
    validate: (value: string) => value.trim().length > 0 || t("profile.nameRequired"),
  };

  return (
    <AppModal
      open={Boolean(selected)}
      onClose={onClose}
      afterClose={() => setUser(null)}
      title={t("staff.detailsTitle")}
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      cancelText={t("table.done")}
      primaryAction={{
        label: t("common.save"),
        disabled: !formState.isDirty,
        loading: confirm.actions.update.isPending,
      }}
    >
      {user && (
        <>
          <div className={styles.head}>
            <UserAvatar firstName={user.firstName} lastName={user.lastName} size={56} />
            <div className={styles.headText}>
              <span className={styles.headName}>
                {user.firstName} {user.lastName}
              </span>
              <span className={styles.headEmail}>{user.email}</span>
              <div className={styles.tags}>
                <RoleTag role={user.role} />
                <UserStatusTag status={user.status} />
              </div>
            </div>
          </div>

          <dl className={styles.facts}>
            <dt>{t("staff.createdAt")}</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
            <dt>{t("staff.lastLogin")}</dt>
            <dd>
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : t("staff.never")}
            </dd>
          </dl>

          <h3 className={styles.section}>{t("staff.editTitle")}</h3>
          <Form layout="vertical" requiredMark={false} component="div">
            <div className={styles.row}>
              <FormField
                label={t("profile.firstName")}
                error={formState.errors.firstName}
                htmlFor="edit-first"
              >
                <Controller
                  name="firstName"
                  control={control}
                  rules={required}
                  render={({ field }) => (
                    <Input {...field} id="edit-first" maxLength={100} />
                  )}
                />
              </FormField>
              <FormField
                label={t("profile.lastName")}
                error={formState.errors.lastName}
                htmlFor="edit-last"
              >
                <Controller
                  name="lastName"
                  control={control}
                  rules={required}
                  render={({ field }) => (
                    <Input {...field} id="edit-last" maxLength={100} />
                  )}
                />
              </FormField>
            </div>
            <FormField
              label={t("staff.role")}
              error={formState.errors.role}
              extra={isSelf ? t("staff.ownRoleLocked") : t("staff.roleChangeHint")}
              htmlFor="edit-role"
            >
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RoleSelect {...field} id="edit-role" disabled={isSelf} />
                )}
              />
            </FormField>
          </Form>

          {user.status === "INVITED" && (
            <div className={styles.zone}>
              <div className={styles.zoneText}>
                <span className={styles.zoneTitle}>{t("staff.resendTitle")}</span>
                <span className={styles.zoneHint}>{t("staff.resendHint")}</span>
              </div>
              <Button
                icon={<MailOutlined />}
                loading={confirm.actions.resend.isPending}
                onClick={() => confirm.resend(user)}
              >
                {t("staff.resendInvite")}
              </Button>
            </div>
          )}
          {user.status === "DEACTIVATED" ? (
            <div className={styles.zone}>
              <div className={styles.zoneText}>
                <span className={styles.zoneTitle}>{t("staff.reactivate")}</span>
                <span className={styles.zoneHint}>{t("staff.reactivateHint")}</span>
              </div>
              <Button icon={<UndoOutlined />} onClick={() => confirm.reactivate(user)}>
                {t("staff.reactivate")}
              </Button>
            </div>
          ) : (
            !isSelf && (
              <div className={styles.zone}>
                <div className={styles.zoneText}>
                  <span className={styles.zoneTitle}>{t("staff.deactivate")}</span>
                  <span className={styles.zoneHint}>{t("staff.deactivateHint")}</span>
                </div>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => confirm.deactivate(user)}
                >
                  {t("staff.deactivate")}
                </Button>
              </div>
            )
          )}
        </>
      )}
    </AppModal>
  );
}
