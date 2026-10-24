import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Form } from "antd";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { PATHS } from "@router/paths";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import {
  NewPasswordFields,
  type NewPasswordValues,
} from "../components/NewPasswordFields";
import { resetPassword } from "../services/authService";
import styles from "./AuthPages.module.css";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const token = useSearchParams()[0].get("token") ?? "";
  const { control, handleSubmit, formState, setError } = useForm<NewPasswordValues>({
    mode: "onSubmit",
    defaultValues: { password: "", confirm: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ password }: NewPasswordValues) => resetPassword(token, password),
    onError: (error) =>
      applyFieldErrors(error, setError, {}, () => t("auth.passwordInvalid")),
  });

  const invalidLink = (
    <AuthLayout>
      <AuthMessage
        icon={<ClockCircleOutlined />}
        tone="warning"
        title={t("auth.resetInvalidTitle")}
        description={t("auth.resetInvalidText")}
        actions={
          <Link to={PATHS.forgotPassword}>
            <Button type="primary">{t("auth.requestNewLink")}</Button>
          </Link>
        }
      />
    </AuthLayout>
  );

  if (!token) return invalidLink;
  // 400 BAD_REQUEST = unknown, used or expired link (the only non-field error here)
  if (isApiError(mutation.error, "BAD_REQUEST")) return invalidLink;

  if (mutation.isSuccess) {
    return (
      <AuthLayout>
        <AuthMessage
          icon={<CheckCircleOutlined />}
          tone="success"
          title={t("auth.resetDoneTitle")}
          description={t("auth.resetDoneText")}
          actions={
            <Link to={PATHS.login}>
              <Button type="primary">{t("auth.loginButton")}</Button>
            </Link>
          }
        />
      </AuthLayout>
    );
  }

  const otherError =
    mutation.error && !isApiError(mutation.error, "VALIDATION_ERROR")
      ? errorMessage(mutation.error)
      : null;

  return (
    <AuthLayout title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      {otherError && (
        <Alert className={styles.alert} type="error" showIcon title={otherError} />
      )}
      <Form
        layout="vertical"
        requiredMark={false}
        onFinish={() => void handleSubmit((v) => mutation.mutate(v))()}
      >
        <NewPasswordFields control={control} errors={formState.errors} />
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={mutation.isPending}
        >
          {t("auth.resetButton")}
        </Button>
      </Form>
    </AuthLayout>
  );
}
