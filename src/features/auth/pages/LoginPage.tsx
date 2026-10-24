import { InfoCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormField } from "@components/ui/FormField";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { PATHS } from "@router/paths";
import { safeRedirect } from "@router/safeRedirect";
import { AuthLayout } from "../components/AuthLayout";
import { useSignedIn } from "../hooks/useAuthActions";
import { login } from "../services/authService";
import styles from "./AuthPages.module.css";

interface LoginValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signedIn = useSignedIn();
  const errorMessage = useErrorMessage();
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    mode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginValues) => login(email, password),
    onSuccess: (user) => {
      signedIn(user);
      void navigate(safeRedirect(params.get("redirect")), { replace: true });
    },
  });

  const error = mutation.error;
  const errorText = !error
    ? null
    : isApiError(error, "UNAUTHORIZED")
      ? t("auth.invalidCredentials")
      : errorMessage(error);

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      {params.get("reason") === "revoked" && !error && (
        <Alert
          className={styles.alert}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          title={t("auth.sessionRevoked")}
        />
      )}
      {errorText && (
        <Alert className={styles.alert} type="error" showIcon title={errorText} />
      )}

      <Form
        className={styles.form}
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
                placeholder="ad.soyad@medflow.az"
              />
            )}
          />
        </FormField>
        <FormField
          label={
            <span className={styles.labelRow}>
              {t("auth.password")}
              <Link to={PATHS.forgotPassword} className={styles.labelLink}>
                {t("auth.forgotLink")}
              </Link>
            </span>
          }
          error={formState.errors.password}
          htmlFor="password"
        >
          <Controller
            name="password"
            control={control}
            rules={{ required: t("auth.passwordRequired") }}
            render={({ field }) => (
              <Input.Password
                {...field}
                id="password"
                autoComplete="current-password"
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
          {t("auth.loginButton")}
        </Button>
      </Form>
      <p className={styles.footnote}>{t("auth.inviteOnly")}</p>
    </AuthLayout>
  );
}
