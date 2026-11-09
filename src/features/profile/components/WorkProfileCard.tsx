import { App, Button, Form, Input, Skeleton } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@components/ui/FormField";
import { useMyStaffProfile, useStaffActions } from "@features/staff/hooks/useStaff";
import type { StaffMember } from "@features/staff/services/staffService";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { formatDay } from "@lib/dayjs";
import { PHONE_PATTERN } from "@utils/phone";
import { SettingsCard } from "./SettingsCard";
import styles from "./ProfileForms.module.css";

interface ContactValues {
  phone: string;
  bio: string;
}

const toValues = (p: StaffMember): ContactValues => ({
  phone: p.phone ?? "",
  bio: p.bio ?? "",
});

// Own work profile (staff-service). Department, title, licence … are set by
// an administrator and only shown; phone and bio are editable here.
export function WorkProfileCard() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const profile = useMyStaffProfile();
  const { updateMe } = useStaffActions();
  const { control, handleSubmit, formState, reset, setError } = useForm<ContactValues>({
    mode: "onSubmit",
    values: profile.data ? toValues(profile.data) : undefined,
  });

  // No profile (should not happen once staff-service has the account)
  if (profile.isError) return null;

  const save = handleSubmit((v) => {
    const before = profile.data ? toValues(profile.data) : { phone: "", bio: "" };
    const phone = v.phone.trim();
    const bio = v.bio.trim();
    updateMe.mutate(
      {
        ...(phone !== before.phone && { phone: phone || null }),
        ...(bio !== before.bio && { bio: bio || null }),
      },
      {
        onSuccess: (updated) => {
          reset(toValues(updated));
          void message.success(t("profile.saved"));
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
        },
      },
    );
  });

  const p = profile.data;
  const facts = p && [
    { label: t("staff.profile.department"), value: p.department?.name },
    { label: t("staff.profile.title"), value: p.title },
    { label: t("staff.profile.specialization"), value: p.specialization },
    { label: t("staff.profile.licenseNumber"), value: p.licenseNumber },
    { label: t("staff.profile.hireDate"), value: p.hireDate && formatDay(p.hireDate) },
  ];

  return (
    <SettingsCard
      title={t("profile.workTitle")}
      description={t("profile.workText")}
      footer={
        p && (
          <>
            <Button
              disabled={!formState.isDirty || updateMe.isPending}
              onClick={() => reset()}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="primary"
              disabled={!formState.isDirty}
              loading={updateMe.isPending}
              onClick={() => void save()}
            >
              {t("common.save")}
            </Button>
          </>
        )
      }
    >
      {!p ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <dl className={styles.facts}>
            {facts!.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value || <span className={styles.empty}>—</span>}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note}>{t("profile.workSetByAdmin")}</p>
          <Form layout="vertical" requiredMark={false} component="div">
            <FormField
              label={t("staff.profile.phone")}
              error={formState.errors.phone}
              htmlFor="work-phone"
            >
              <Controller
                name="phone"
                control={control}
                rules={{
                  validate: (value) =>
                    !value.trim() ||
                    PHONE_PATTERN.test(value.trim()) ||
                    t("staff.profile.phoneInvalid"),
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="work-phone"
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="+994 50 123 45 67"
                    className={styles.narrow}
                  />
                )}
              />
            </FormField>
            <FormField
              label={t("staff.profile.bio")}
              error={formState.errors.bio}
              extra={t("profile.bioHint")}
              htmlFor="work-bio"
            >
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    id="work-bio"
                    maxLength={2000}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                  />
                )}
              />
            </FormField>
          </Form>
        </>
      )}
    </SettingsCard>
  );
}
