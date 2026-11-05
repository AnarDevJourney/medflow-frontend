import { ClusterOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Form, Input } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { isApiError } from "@lib/api/errors";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useDepartmentActions } from "../hooks/useDepartments";
import type { Department } from "../services/departmentsService";
import styles from "./DepartmentModal.module.css";

interface DepartmentValues {
  code: string;
  name: string;
  location: string;
  phone: string;
  description: string;
}

const EMPTY: DepartmentValues = {
  code: "",
  name: "",
  location: "",
  phone: "",
  description: "",
};

const toValues = (department: Department): DepartmentValues => ({
  code: department.code,
  name: department.name,
  location: department.location ?? "",
  phone: department.phone ?? "",
  description: department.description ?? "",
});

// Same rules as the backend DTOs
const PHONE_PATTERN = /^\+?[0-9 ()-]{5,19}$/;

// Add (department = null) or edit one. The code is fixed after creation.
export function DepartmentModal({
  open,
  department: selected,
  onClose,
}: {
  open: boolean;
  department: Department | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { create, update } = useDepartmentActions();
  // The last opened department stays rendered while the modal animates out
  const [department, setDepartment] = useState(selected);
  if (selected && selected !== department) setDepartment(selected);
  const editing = department !== null;

  const { control, handleSubmit, formState, reset, setError } = useForm<DepartmentValues>(
    {
      mode: "onSubmit",
      defaultValues: EMPTY,
      values: department ? toValues(department) : EMPTY,
    },
  );

  const onError = (error: unknown) => {
    if (isApiError(error, "CONFLICT")) {
      const { field } = (error.details ?? {}) as { field?: "code" | "name" };
      if (field) {
        setError(field, { message: t(`departments.${field}Taken`) });
        return;
      }
    }
    if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
  };

  const submit = handleSubmit((v) => {
    const fields = {
      name: v.name.trim(),
      location: v.location.trim() || null,
      phone: v.phone.trim() || null,
      description: v.description.trim() || null,
    };
    if (department) {
      update.mutate(
        { id: department.id, input: fields },
        {
          onSuccess: () => {
            void message.success(t("departments.saved"));
            onClose();
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { ...fields, code: v.code.trim() },
        {
          onSuccess: (created) => {
            void message.success(t("departments.created", { name: created.name }));
            onClose();
          },
          onError,
        },
      );
    }
  });

  const { errors } = formState;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      afterClose={() => {
        setDepartment(null);
        reset(EMPTY);
      }}
      title={t(editing ? "departments.editTitle" : "departments.createTitle")}
      description={t(editing ? "departments.editText" : "departments.createText")}
      icon={editing ? <EditOutlined /> : <ClusterOutlined />}
      onSubmit={(event) => void submit(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t(editing ? "common.save" : "departments.addButton"),
        icon: editing ? undefined : <PlusOutlined />,
        loading: create.isPending || update.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <div className={styles.identity}>
          <FormField
            label={t("departments.name")}
            error={errors.name}
            htmlFor="department-name"
          >
            <Controller
              name="name"
              control={control}
              rules={{
                validate: (value) =>
                  value.trim().length > 0 || t("departments.nameRequired"),
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="department-name"
                  autoFocus
                  maxLength={100}
                  placeholder={t("departments.namePlaceholder")}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("departments.code")}
            error={errors.code}
            htmlFor="department-code"
          >
            <Controller
              name="code"
              control={control}
              rules={{
                validate: (value) =>
                  value.trim().length > 0 || t("departments.codeRequired"),
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="department-code"
                  disabled={editing}
                  maxLength={10}
                  placeholder="CARD"
                  className={styles.code}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              )}
            />
          </FormField>
        </div>
        <p className={styles.hint}>
          {t(editing ? "departments.codeLockedHint" : "departments.codeHint")}
        </p>
        <div className={styles.row}>
          <FormField
            label={t("departments.location")}
            error={errors.location}
            htmlFor="department-location"
          >
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="department-location"
                  maxLength={100}
                  placeholder={t("departments.locationPlaceholder")}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("departments.phone")}
            error={errors.phone}
            htmlFor="department-phone"
          >
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (value) =>
                  !value.trim() ||
                  PHONE_PATTERN.test(value.trim()) ||
                  t("departments.phoneInvalid"),
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="department-phone"
                  type="tel"
                  maxLength={20}
                  placeholder="+994 12 555 10 20"
                />
              )}
            />
          </FormField>
        </div>
        <FormField
          label={t("departments.description")}
          error={errors.description}
          htmlFor="department-description"
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="department-description"
                rows={3}
                maxLength={1000}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
