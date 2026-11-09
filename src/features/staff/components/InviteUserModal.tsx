import { MailOutlined, UserAddOutlined } from "@ant-design/icons";
import { App, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import type { Role } from "@models/enums";
import { useUserActions } from "../hooks/useUsers";
import { RoleSelect } from "./RoleSelect";
import styles from "./StaffModals.module.css";

interface InviteValues {
  email: string;
  firstName: string;
  lastName: string;
  role: Role | undefined;
  departmentId: string | undefined;
  title: string;
}

const EMPTY: InviteValues = {
  email: "",
  firstName: "",
  lastName: "",
  role: undefined,
  departmentId: undefined,
  title: "",
};

// New staff member: an INVITED account + an email with a 72-hour link.
// Department and job title go to the staff profile, which staff-service
// creates from the invite; both are optional.
export function InviteUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { invite } = useUserActions();
  const { control, handleSubmit, formState, reset, setError } = useForm<InviteValues>({
    mode: "onSubmit",
    defaultValues: EMPTY,
  });

  const close = () => {
    onClose();
    invite.reset();
  };

  const submit = handleSubmit((v) =>
    invite.mutate(
      {
        email: v.email.trim(),
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        role: v.role!,
        departmentId: v.departmentId,
        title: v.title.trim() || undefined,
      },
      {
        onSuccess: (user) => {
          void message.success(t("staff.invited", { email: user.email }));
          close();
        },
        onError: (error) => {
          if (isApiError(error, "CONFLICT"))
            setError("email", { message: t("staff.emailTaken") });
          else if (isApiError(error, "BUSINESS_RULE"))
            setError("departmentId", {
              message: t("staff.profile.departmentUnavailable"),
            });
          else if (!applyFieldErrors(error, setError))
            void message.error(errorMessage(error));
        },
      },
    ),
  );

  const required = (message: string) => ({
    validate: (value: string | undefined) => (value ?? "").trim().length > 0 || message,
  });

  return (
    <AppModal
      open={open}
      onClose={close}
      afterClose={() => reset(EMPTY)}
      title={t("staff.inviteTitle")}
      description={t("staff.inviteText")}
      icon={<UserAddOutlined />}
      onSubmit={(event) => void submit(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t("staff.sendInvite"),
        icon: <MailOutlined />,
        loading: invite.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("auth.email")}
          error={formState.errors.email}
          htmlFor="invite-email"
        >
          <Controller
            name="email"
            control={control}
            rules={{
              required: t("auth.emailRequired"),
              pattern: { value: /^\S+@\S+\.\S+$/, message: t("auth.emailInvalid") },
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="invite-email"
                type="email"
                autoFocus
                placeholder="ad.soyad@medflow.az"
              />
            )}
          />
        </FormField>
        <div className={styles.row}>
          <FormField
            label={t("profile.firstName")}
            error={formState.errors.firstName}
            htmlFor="invite-first"
          >
            <Controller
              name="firstName"
              control={control}
              rules={required(t("profile.nameRequired"))}
              render={({ field }) => (
                <Input {...field} id="invite-first" maxLength={100} />
              )}
            />
          </FormField>
          <FormField
            label={t("profile.lastName")}
            error={formState.errors.lastName}
            htmlFor="invite-last"
          >
            <Controller
              name="lastName"
              control={control}
              rules={required(t("profile.nameRequired"))}
              render={({ field }) => (
                <Input {...field} id="invite-last" maxLength={100} />
              )}
            />
          </FormField>
        </div>
        <FormField
          label={t("staff.role")}
          error={formState.errors.role}
          htmlFor="invite-role"
        >
          <Controller
            name="role"
            control={control}
            rules={{ required: t("staff.roleRequired") }}
            render={({ field }) => (
              <RoleSelect
                {...field}
                id="invite-role"
                placeholder={t("staff.chooseRole")}
              />
            )}
          />
        </FormField>
        <div className={styles.row}>
          <FormField
            label={t("staff.profile.department")}
            error={formState.errors.departmentId}
            extra={t("staff.optional")}
            htmlFor="invite-department"
          >
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <DepartmentSelect
                  {...field}
                  id="invite-department"
                  allowClear
                  placeholder={t("staff.profile.chooseDepartment")}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("staff.profile.title")}
            error={formState.errors.title}
            extra={t("staff.optional")}
            htmlFor="invite-title"
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="invite-title"
                  maxLength={100}
                  placeholder={t("staff.profile.titlePlaceholder")}
                />
              )}
            />
          </FormField>
        </div>
      </Form>
    </AppModal>
  );
}
