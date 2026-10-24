import { Input } from "antd";
import { Controller, type Control, type FieldErrors, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@components/ui/FormField";
import { PasswordRules } from "@components/ui/PasswordRules";
import { passwordProblems } from "@utils/password";

export interface NewPasswordValues {
  password: string;
  confirm: string;
}

interface NewPasswordFieldsProps<T extends NewPasswordValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  passwordLabel?: string;
}

// New password + confirmation with the live policy checklist (accept
// invite, reset password, change password)
export function NewPasswordFields<T extends NewPasswordValues>({
  control,
  errors,
  passwordLabel,
}: NewPasswordFieldsProps<T>) {
  const { t } = useTranslation();
  // The generic form type erases field names for RHF; the fields are fixed here
  const c = control as unknown as Control<NewPasswordValues>;
  const e = errors as FieldErrors<NewPasswordValues>;
  const password = useWatch({ control: c, name: "password" }) ?? "";

  return (
    <>
      <FormField
        label={passwordLabel ?? t("auth.newPassword")}
        error={e.password}
        required
        htmlFor="password"
      >
        <Controller
          name="password"
          control={c}
          rules={{
            validate: (value) =>
              passwordProblems(value).length === 0 || t("auth.passwordInvalid"),
          }}
          render={({ field }) => (
            <Input.Password
              {...field}
              id="password"
              autoComplete="new-password"
              size="large"
            />
          )}
        />
      </FormField>
      <PasswordRules value={password} />
      <FormField
        label={t("auth.confirmPassword")}
        error={e.confirm}
        required
        htmlFor="confirm"
      >
        <Controller
          name="confirm"
          control={c}
          rules={{
            required: t("auth.confirmRequired"),
            validate: (value, values) =>
              value === values.password || t("auth.passwordsDiffer"),
          }}
          render={({ field }) => (
            <Input.Password
              {...field}
              id="confirm"
              autoComplete="new-password"
              size="large"
            />
          )}
        />
      </FormField>
    </>
  );
}
