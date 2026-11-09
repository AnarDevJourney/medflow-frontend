import { IdcardOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Input } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs from "@lib/dayjs";
import { PHONE_PATTERN } from "@utils/phone";
import { useStaffActions } from "../hooks/useStaff";
import type { StaffMember, UpdateStaffInput } from "../services/staffService";
import styles from "./StaffModals.module.css";

interface ProfileValues {
  departmentId: string | null;
  title: string;
  specialization: string;
  licenseNumber: string;
  hireDate: string | null; // YYYY-MM-DD
  phone: string;
  bio: string;
}

const toValues = (s: StaffMember): ProfileValues => ({
  departmentId: s.department?.id ?? null,
  title: s.title ?? "",
  specialization: s.specialization ?? "",
  licenseNumber: s.licenseNumber ?? "",
  hireDate: s.hireDate,
  phone: s.phone ?? "",
  bio: s.bio ?? "",
});

const TEXT_FIELDS = ["title", "specialization", "licenseNumber", "phone", "bio"] as const;

// Work profile (staff.update): department, title, licence … Name, email and
// role belong to the account (UserModal). Only changed fields are sent;
// an emptied field is sent as null.
export function StaffProfileModal({
  staff: selected,
  onClose,
}: {
  staff: StaffMember | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { update } = useStaffActions();
  // The last opened person stays rendered while the modal animates out
  const [staff, setStaff] = useState(selected);
  if (selected && selected !== staff) setStaff(selected);

  const { control, handleSubmit, formState, setError } = useForm<ProfileValues>({
    mode: "onSubmit",
    values: staff ? toValues(staff) : undefined,
  });

  const save = handleSubmit((v) => {
    if (!staff) return;
    const before = toValues(staff);
    const input: UpdateStaffInput = {};
    for (const field of TEXT_FIELDS) {
      const value = v[field].trim();
      if (value !== before[field]) input[field] = value || null;
    }
    if (v.departmentId !== before.departmentId) input.departmentId = v.departmentId;
    if (v.hireDate !== before.hireDate) input.hireDate = v.hireDate;

    update.mutate(
      { userId: staff.userId, input },
      {
        onSuccess: () => {
          void message.success(t("staff.saved"));
          onClose();
        },
        onError: (error) => {
          if (isApiError(error, "CONFLICT")) {
            setError("licenseNumber", { message: t("staff.profile.licenseTaken") });
          } else if (isApiError(error, "BUSINESS_RULE")) {
            setError("departmentId", {
              message: t("staff.profile.departmentUnavailable"),
            });
          } else if (!applyFieldErrors(error, setError)) {
            void message.error(errorMessage(error));
          }
        },
      },
    );
  });

  return (
    <AppModal
      open={Boolean(selected)}
      onClose={onClose}
      afterClose={() => setStaff(null)}
      title={t("staff.profile.editTitle")}
      description={staff ? `${staff.firstName} ${staff.lastName}` : undefined}
      icon={<IdcardOutlined />}
      size="md"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t("common.save"),
        disabled: !formState.isDirty,
        loading: update.isPending,
      }}
    >
      {staff && (
        <Form layout="vertical" requiredMark={false} component="div">
          <FormField
            label={t("staff.profile.department")}
            error={formState.errors.departmentId}
            htmlFor="profile-department"
          >
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <DepartmentSelect
                  id="profile-department"
                  allowClear
                  placeholder={t("staff.profile.noDepartment")}
                  current={staff.department}
                  value={field.value ?? undefined}
                  onChange={(value) => field.onChange(value ?? null)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>
          <div className={styles.row}>
            <FormField
              label={t("staff.profile.title")}
              error={formState.errors.title}
              htmlFor="profile-title"
            >
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="profile-title"
                    maxLength={100}
                    placeholder={t("staff.profile.titlePlaceholder")}
                  />
                )}
              />
            </FormField>
            <FormField
              label={t("staff.profile.specialization")}
              error={formState.errors.specialization}
              htmlFor="profile-specialization"
            >
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="profile-specialization" maxLength={100} />
                )}
              />
            </FormField>
          </div>
          <div className={styles.row}>
            <FormField
              label={t("staff.profile.licenseNumber")}
              error={formState.errors.licenseNumber}
              htmlFor="profile-license"
            >
              <Controller
                name="licenseNumber"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="profile-license" maxLength={50} />
                )}
              />
            </FormField>
            <FormField
              label={t("staff.profile.hireDate")}
              error={formState.errors.hireDate}
              htmlFor="profile-hire-date"
            >
              <Controller
                name="hireDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="profile-hire-date"
                    className={styles.full}
                    format="DD.MM.YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(day) =>
                      field.onChange(day ? day.format("YYYY-MM-DD") : null)
                    }
                    disabledDate={(day) => day.isAfter(dayjs().add(1, "year"))}
                  />
                )}
              />
            </FormField>
          </div>
          <FormField
            label={t("staff.profile.phone")}
            error={formState.errors.phone}
            htmlFor="profile-phone"
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
                  id="profile-phone"
                  maxLength={20}
                  placeholder="+994 50 123 45 67"
                />
              )}
            />
          </FormField>
          <FormField
            label={t("staff.profile.bio")}
            error={formState.errors.bio}
            htmlFor="profile-bio"
          >
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  id="profile-bio"
                  maxLength={2000}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              )}
            />
          </FormField>
        </Form>
      )}
    </AppModal>
  );
}
