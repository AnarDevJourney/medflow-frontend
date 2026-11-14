import { EditOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Input, Radio } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs from "@lib/dayjs";
import { ConditionStatus } from "@models/enums";
import { useClinicalActions } from "../../hooks/usePatients";
import type { Condition, ConditionInput } from "../../services/patientsService";
import styles from "./Clinical.module.css";

// Same rule as patient-service: E11, I10, J45.909
const ICD10_PATTERN = /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/;

interface ConditionValues {
  name: string;
  icd10Code: string;
  diagnosedOn: string | null;
  status: ConditionStatus;
  notes: string;
}

const EMPTY: ConditionValues = {
  name: "",
  icd10Code: "",
  diagnosedOn: null,
  status: ConditionStatus.ACTIVE,
  notes: "",
};

const toValues = (c: Condition): ConditionValues => ({
  name: c.name,
  icd10Code: c.icd10Code ?? "",
  diagnosedOn: c.diagnosedOn,
  status: c.status,
  notes: c.notes ?? "",
});

const toInput = (v: ConditionValues): ConditionInput => ({
  name: v.name.trim(),
  icd10Code: v.icd10Code.trim().toUpperCase() || null,
  diagnosedOn: v.diagnosedOn,
  status: v.status,
  notes: v.notes.trim() || null,
});

// Add a chronic condition (condition = null) or update one: status, notes,
// and fixing the name / code / date. ICD-10 is typed for now; the lookup
// comes with the medical-record service.
export function ConditionModal({
  open,
  patientId,
  patientLabel,
  condition: selected,
  onClose,
}: {
  open: boolean;
  patientId: string;
  patientLabel: string;
  condition: Condition | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { addCondition, updateCondition } = useClinicalActions(patientId);
  const [condition, setCondition] = useState(selected);
  if (selected && selected !== condition) setCondition(selected);
  const editing = Boolean(condition);

  const { control, handleSubmit, formState, setError, reset } = useForm<ConditionValues>({
    mode: "onSubmit",
    values: condition ? toValues(condition) : EMPTY,
  });

  const onError = (error: unknown) => {
    if (isApiError(error, "BUSINESS_RULE")) {
      return setError("diagnosedOn", { message: t("clinical.diagnosedOnFuture") });
    }
    if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
  };

  const save = handleSubmit((v) => {
    const input = toInput(v);
    if (condition) {
      const before = toInput(toValues(condition));
      const changed = Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => value !== before[key as keyof ConditionInput],
        ),
      ) as Partial<ConditionInput>;
      updateCondition.mutate(
        { id: condition.id, input: changed },
        {
          onSuccess: () => {
            void message.success(t("clinical.conditionSaved"));
            onClose();
          },
          onError,
        },
      );
      return;
    }
    addCondition.mutate(input, {
      onSuccess: (created) => {
        void message.success(t("clinical.conditionAdded", { name: created.name }));
        onClose();
      },
      onError,
    });
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      afterClose={() => {
        setCondition(null);
        reset(EMPTY);
      }}
      title={t(editing ? "clinical.editConditionTitle" : "clinical.addConditionTitle")}
      description={patientLabel}
      icon={editing ? <EditOutlined /> : <MedicineBoxOutlined />}
      size="md"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t(editing ? "common.save" : "clinical.add"),
        disabled: editing && !formState.isDirty,
        loading: addCondition.isPending || updateCondition.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("clinical.fields.condition")}
          required
          error={formState.errors.name}
          htmlFor="condition-name"
        >
          <Controller
            name="name"
            control={control}
            rules={{
              validate: (v) => Boolean(v.trim()) || t("clinical.conditionRequired"),
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="condition-name"
                maxLength={150}
                placeholder={t("clinical.conditionPlaceholder")}
                autoComplete="off"
              />
            )}
          />
        </FormField>
        <div className={styles.row2}>
          <FormField
            label={t("clinical.fields.icd10Code")}
            error={formState.errors.icd10Code}
            htmlFor="condition-icd"
          >
            <Controller
              name="icd10Code"
              control={control}
              rules={{
                validate: (v) =>
                  !v.trim() ||
                  ICD10_PATTERN.test(v.trim().toUpperCase()) ||
                  t("clinical.icdInvalid"),
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  id="condition-icd"
                  maxLength={10}
                  placeholder="E11"
                  autoComplete="off"
                />
              )}
            />
          </FormField>
          <FormField
            label={t("clinical.fields.diagnosedOn")}
            error={formState.errors.diagnosedOn}
            htmlFor="condition-date"
          >
            <Controller
              name="diagnosedOn"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="condition-date"
                  className={styles.full}
                  format="DD.MM.YYYY"
                  placeholder="DD.MM.YYYY"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(day) =>
                    field.onChange(day ? day.format("YYYY-MM-DD") : null)
                  }
                  disabledDate={(day) => day.isAfter(dayjs(), "day")}
                />
              )}
            />
          </FormField>
        </div>
        <FormField label={t("clinical.fields.status")} error={formState.errors.status}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Radio.Group
                optionType="button"
                className={styles.segmented}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                options={Object.values(ConditionStatus).map((s) => ({
                  value: s,
                  label: t(`clinical.conditionStatus.${s}`),
                }))}
                aria-label={t("clinical.fields.status")}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("clinical.fields.notes")}
          error={formState.errors.notes}
          htmlFor="condition-notes"
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="condition-notes"
                maxLength={2000}
                autoSize={{ minRows: 2, maxRows: 5 }}
                placeholder={t("clinical.notesPlaceholder")}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
