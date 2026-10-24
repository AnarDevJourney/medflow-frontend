import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Form, Skeleton } from "antd";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RoleTag } from "@components/ui/RoleTag";
import { UserAvatar } from "@components/ui/UserAvatar";
import { applyFieldErrors } from "@lib/api/formErrors";
import { toClinicTime } from "@lib/dayjs";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { PATHS } from "@router/paths";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import {
  NewPasswordFields,
  type NewPasswordValues,
} from "../components/NewPasswordFields";
import { useSignedIn } from "../hooks/useAuthActions";
import { acceptInvite, previewInvitation } from "../services/authService";
import styles from "./AuthPages.module.css";

// The link from the invitation email: show who is invited, set a password,
// and the new staff member is signed in right away
export function AcceptInvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const errorMessage = useErrorMessage();
  const token = useSearchParams()[0].get("token") ?? "";

  const preview = useQuery({
    queryKey: ["auth", "invitation", token],
    queryFn: () => previewInvitation(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
  const { control, handleSubmit, formState, setError } = useForm<NewPasswordValues>({
    mode: "onSubmit",
    defaultValues: { password: "", confirm: "" },
  });
  const mutation = useMutation({
    mutationFn: ({ password }: NewPasswordValues) => acceptInvite(token, password),
    onSuccess: (user) => {
      signedIn(user);
      void navigate(PATHS.home, { replace: true });
    },
    onError: (error) =>
      applyFieldErrors(error, setError, {}, () => t("auth.passwordInvalid")),
  });

  const problem = !token ? "invalid" : inviteProblem(preview.error ?? mutation.error);
  if (problem === "expired") {
    return (
      <AuthLayout>
        <AuthMessage
          icon={<ClockCircleOutlined />}
          tone="warning"
          title={t("auth.inviteExpiredTitle")}
          description={t("auth.inviteExpiredText")}
        />
      </AuthLayout>
    );
  }
  if (problem === "used") {
    return (
      <AuthLayout>
        <AuthMessage
          icon={<CheckCircleOutlined />}
          tone="info"
          title={t("auth.inviteUsedTitle")}
          description={t("auth.inviteUsedText")}
          actions={
            <Link to={PATHS.login}>
              <Button type="primary">{t("auth.loginButton")}</Button>
            </Link>
          }
        />
      </AuthLayout>
    );
  }
  if (problem === "invalid") {
    return (
      <AuthLayout>
        <AuthMessage
          icon={<DisconnectOutlined />}
          tone="error"
          title={t("auth.inviteInvalidTitle")}
          description={t("auth.inviteInvalidText")}
        />
      </AuthLayout>
    );
  }

  const invite = preview.data;
  const otherError =
    preview.error || (mutation.error && !isApiError(mutation.error, "VALIDATION_ERROR"))
      ? errorMessage(preview.error ?? mutation.error)
      : null;

  return (
    <AuthLayout
      title={
        invite
          ? t("auth.inviteTitle", { name: invite.firstName })
          : t("auth.inviteTitleShort")
      }
      subtitle={t("auth.inviteSubtitle")}
    >
      {otherError && (
        <Alert className={styles.alert} type="error" showIcon title={otherError} />
      )}
      {!invite && preview.isPending ? (
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      ) : (
        invite && (
          <>
            <div className={styles.invitee}>
              <UserAvatar
                firstName={invite.firstName}
                lastName={invite.lastName}
                size={40}
              />
              <div className={styles.inviteeText}>
                <span className={styles.inviteeName}>
                  {invite.firstName} {invite.lastName}
                </span>
                <span className={styles.inviteeEmail}>{invite.email}</span>
              </div>
              <RoleTag role={invite.role} />
            </div>
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={() => void handleSubmit((v) => mutation.mutate(v))()}
            >
              <NewPasswordFields
                control={control}
                errors={formState.errors}
                passwordLabel={t("auth.choosePassword")}
              />
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={mutation.isPending}
              >
                {t("auth.inviteButton")}
              </Button>
            </Form>
            <p className={styles.footnote}>
              <Trans
                i18nKey="auth.inviteExpires"
                values={{
                  date: toClinicTime(invite.expiresAt).format("DD.MM.YYYY HH:mm"),
                }}
                components={{ b: <strong /> }}
              />
            </p>
          </>
        )
      )}
    </AuthLayout>
  );
}

// 404 unknown link · 409 already accepted / account no longer invited · 410 expired
function inviteProblem(error: unknown): "expired" | "used" | "invalid" | null {
  if (!isApiError(error)) return null;
  if (error.code === "INVITE_EXPIRED") return "expired";
  if (error.status === 409) return "used";
  if (error.status === 404) return "invalid";
  return null;
}
