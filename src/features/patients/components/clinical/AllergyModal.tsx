import { AlertOutlined, EditOutlined } from "@ant-design/icons";
import { App, Form, Input, Radio, Select } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { AllergyCategory, AllergySeverity } from "@models/enums";
import { useClinicalActions } from "../../hooks/usePatients";
import type { Allergy, AllergyInput } from "../../services/patientsService";
import styles from "./Clinical.module.css";

interface AllergyValues {
  allergen: string;
  category: AllergyCategory | null;
  severity: AllergySeverity | null;
  reaction: string;
}

const EMPTY: AllergyValues = {
  allergen: "",
  category: null,
  severity: null,
  reaction: "",
};

const toValues = (a: Allergy): AllergyValues => ({
  allergen: a.allergen,
  category: a.category,
  severity: a.severity,
  reaction: a.reaction ?? "",
});

const toInput = (v: AllergyValues): AllergyInput => ({
  allergen: v.allergen.trim(),
  category: v.category!,
  severity: v.severity!,
  reaction: v.reaction.trim() || null,
});

// Record a known allergy (allergy = null) or edit one — every field, like
// a chronic condition (severity and reactions change over time)
export function AllergyModal({
  open,
  patientId,
  patientLabel,
  allergy: selected,
  onClose,
}: {
  open: boolean;
  patientId: string;
  patientLabel: string;
  allergy: Allergy | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { addAllergy, updateAllergy } = useClinicalActions(patientId);
  // The last edited allergy stays rendered while the modal animates out
  const [allergy, setAllergy] = useState(selected);
  if (selected && selected !== allergy) setAllergy(selected);
  const editing = Boolean(allergy);
  const { control, handleSubmit, formState, setError, reset } = useForm<AllergyValues>({
    mode: "onSubmit",
    values: allergy ? toValues(allergy) : EMPTY,
  });

  const onError = (error: unknown) => {
    if (isApiError(error, "CONFLICT")) {
      setError("allergen", { message: t("clinical.allergyExists") });
    } else if (!applyFieldErrors(error, setError)) {
      void message.error(errorMessage(error));
    }
  };

  // Edit sends only the changed fields
  const save = handleSubmit((v) => {
    const input = toInput(v);
    if (allergy) {
      const before = toInput(toValues(allergy));
      const changed = Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => value !== before[key as keyof AllergyInput],
        ),
      ) as Partial<AllergyInput>;
      updateAllergy.mutate(
        { id: allergy.id, input: changed },
        {
          onSuccess: () => {
            void message.success(t("clinical.allergySaved"));
            onClose();
          },
          onError,
        },
      );
      return;
    }
    addAllergy.mutate(input, {
      onSuccess: (created) => {
        void message.success(t("clinical.allergyAdded", { name: created.allergen }));
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
        setAllergy(null);
        reset(EMPTY);
      }}
      title={t(editing ? "clinical.editAllergyTitle" : "clinical.addAllergyTitle")}
      description={patientLabel}
      icon={editing ? <EditOutlined /> : <AlertOutlined />}
      tone="danger"
      size="md"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t(editing ? "common.save" : "clinical.add"),
        disabled: editing && !formState.isDirty,
        loading: addAllergy.isPending || updateAllergy.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("clinical.fields.allergen")}
          required
          error={formState.errors.allergen}
          htmlFor="allergy-allergen"
        >
          <Controller
            name="allergen"
            control={control}
            rules={{
              validate: (v) => Boolean(v.trim()) || t("clinical.allergenRequired"),
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="allergy-allergen"
                maxLength={100}
                placeholder={t("clinical.allergenPlaceholder")}
                autoComplete="off"
              />
            )}
          />
        </FormField>
        <FormField
          label={t("clinical.fields.category")}
          required
          error={formState.errors.category}
          htmlFor="allergy-category"
        >
          <Controller
            name="category"
            control={control}
            rules={{ required: t("clinical.categoryRequired") }}
            render={({ field }) => (
              <Select<AllergyCategory>
                id="allergy-category"
                placeholder={t("clinical.categoryPlaceholder")}
                value={field.value ?? undefined}
                onChange={field.onChange}
                options={Object.values(AllergyCategory).map((c) => ({
                  value: c,
                  label: t(`clinical.category.${c}`),
                }))}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("clinical.fields.severity")}
          required
          error={formState.errors.severity}
        >
          <Controller
            name="severity"
            control={control}
            rules={{ required: t("clinical.severityRequired") }}
            render={({ field }) => (
              <Radio.Group
                optionType="button"
                className={styles.segmented}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                options={[
                  AllergySeverity.MILD,
                  AllergySeverity.MODERATE,
                  AllergySeverity.SEVERE,
                ].map((s) => ({ value: s, label: t(`clinical.severity.${s}`) }))}
                aria-label={t("clinical.fields.severity")}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("clinical.fields.reaction")}
          error={formState.errors.reaction}
          htmlFor="allergy-reaction"
        >
          <Controller
            name="reaction"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="allergy-reaction"
                maxLength={255}
                placeholder={t("clinical.reactionPlaceholder")}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
