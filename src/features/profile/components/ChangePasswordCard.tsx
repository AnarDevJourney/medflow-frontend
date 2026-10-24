import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@components/ui/FormField";
import { NewPasswordFields } from "@features/auth/components/NewPasswordFields";
import { currentUserQueryKey } from "@features/auth/hooks/useCurrentUser";
import { changePassword } from "@features/auth/services/authService";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

interface PasswordValues {
  currentPassword: string;
  password: string;
  confirm: string;
}

const EMPTY: PasswordValues = { currentPassword: "", password: "", confirm: "" };

// PATCH /auth/change-password: this session continues with new cookies,
// every other session is signed out
export function ChangePasswordCard() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { control, handleSubmit, formState, reset, setError } = useForm<PasswordValues>({
    mode: "onSubmit",
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    mutationFn: (v: PasswordValues) => changePassword(v.currentPassword, v.password),
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      reset(EMPTY);
      void message.success(t("profile.passwordChanged"));
    },
    onError: (error) => {
      // currentPassword: wrong / newPassword: same as old or not allowed
      const applied = applyFieldErrors(
        error,
        setError,
        { newPassword: "password" },
        (field, text) =>
          field === "currentPassword"
            ? t("profile.currentWrong")
            : /differ|same/i.test(text)
              ? t("profile.samePassword")
              : t("auth.passwordInvalid"),
      );
      if (!applied) void message.error(errorMessage(error));
    },
  });

  return (
    <SettingsCard
      title={t("profile.passwordTitle")}
      description={t("profile.passwordText")}
      footer={
        <Button
          type="primary"
          loading={mutation.isPending}
          onClick={() => void handleSubmit((v) => mutation.mutate(v))()}
        >
          {t("profile.changePassword")}
        </Button>
      }
    >
      <Form
        layout="vertical"
        requiredMark={false}
        component="div"
        className={styles.narrow}
      >
        <FormField
          label={t("profile.currentPassword")}
          error={formState.errors.currentPassword}
          htmlFor="currentPassword"
        >
          <Controller
            name="currentPassword"
            control={control}
            rules={{ required: t("auth.passwordRequired") }}
            render={({ field }) => (
              <Input.Password
                {...field}
                id="currentPassword"
                autoComplete="current-password"
              />
            )}
          />
        </FormField>
        <NewPasswordFields control={control} errors={formState.errors} />
      </Form>
    </SettingsCard>
  );
}
