import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FormField } from "@components/ui/FormField";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { PATHS } from "@router/paths";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { forgotPassword } from "../services/authService";
import styles from "./AuthPages.module.css";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { control, handleSubmit, formState, getValues } = useForm<{ email: string }>({
    mode: "onSubmit",
    defaultValues: { email: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ email }: { email: string }) => forgotPassword(email),
  });

  const backToLogin = (
    <Link to={PATHS.login} className={styles.back}>
      <ArrowLeftOutlined /> {t("auth.backToLogin")}
    </Link>
  );

  // The server always answers 200 — whether the account exists stays secret
  if (mutation.isSuccess) {
    return (
      <AuthLayout>
        <AuthMessage
          icon={<MailOutlined />}
          tone="success"
          title={t("auth.forgotSentTitle")}
          description={
            <Trans
              i18nKey="auth.forgotSentText"
              values={{ email: getValues("email") }}
              components={{ b: <strong /> }}
            />
          }
        />
        {backToLogin}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")}>
      {mutation.error && (
        <Alert
          className={styles.alert}
          type="error"
          showIcon
          title={errorMessage(mutation.error)}
        />
      )}
      <Form
        layout="vertical"
        requiredMark={false}
        onFinish={() => void handleSubmit((v) => mutation.mutate(v))()}
      >
        <FormField label={t("auth.email")} error={formState.errors.email} htmlFor="email">
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
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                size="large"
              />
            )}
          />
        </FormField>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={mutation.isPending}
        >
          {t("auth.forgotButton")}
        </Button>
      </Form>
      {backToLogin}
    </AuthLayout>
  );
}
