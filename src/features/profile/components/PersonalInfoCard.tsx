import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@components/ui/FormField";
import { currentUserQueryKey } from "@features/auth/hooks/useCurrentUser";
import { updateProfile, type CurrentUser } from "@features/auth/services/authService";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

interface NameValues {
  firstName: string;
  lastName: string;
}

// First / last name (PATCH /auth/me). The email is the login: only an
// administrator could change it, and today nobody can.
export function PersonalInfoCard({ user }: { user: CurrentUser }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { control, handleSubmit, formState, reset, setError } = useForm<NameValues>({
    mode: "onSubmit",
    values: { firstName: user.firstName, lastName: user.lastName },
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(currentUserQueryKey, updated);
      reset({ firstName: updated.firstName, lastName: updated.lastName });
      void message.success(t("profile.saved"));
    },
    onError: (error) => {
      if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
    },
  });

  const nameRules = {
    validate: (value: string) => value.trim().length > 0 || t("profile.nameRequired"),
    maxLength: { value: 100, message: t("profile.nameTooLong") },
  };

  return (
    <SettingsCard
      title={t("profile.personalTitle")}
      description={t("profile.personalText")}
      footer={
        <>
          <Button
            disabled={!formState.isDirty || mutation.isPending}
            onClick={() => reset()}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="primary"
            disabled={!formState.isDirty}
            loading={mutation.isPending}
            onClick={() =>
              void handleSubmit((v) =>
                mutation.mutate({
                  firstName: v.firstName.trim(),
                  lastName: v.lastName.trim(),
                }),
              )()
            }
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <div className={styles.row}>
          <FormField
            label={t("profile.firstName")}
            error={formState.errors.firstName}
            htmlFor="firstName"
          >
            <Controller
              name="firstName"
              control={control}
              rules={nameRules}
              render={({ field }) => (
                <Input {...field} id="firstName" autoComplete="given-name" />
              )}
            />
          </FormField>
          <FormField
            label={t("profile.lastName")}
            error={formState.errors.lastName}
            htmlFor="lastName"
          >
            <Controller
              name="lastName"
              control={control}
              rules={nameRules}
              render={({ field }) => (
                <Input {...field} id="lastName" autoComplete="family-name" />
              )}
            />
          </FormField>
        </div>
        <FormField
          label={t("auth.email")}
          extra={t("profile.emailLocked")}
          htmlFor="email"
        >
          <Input id="email" value={user.email} disabled />
        </FormField>
      </Form>
    </SettingsCard>
  );
}
