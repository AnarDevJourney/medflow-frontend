import { UserAddOutlined, EditOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Input, Radio, Select } from "antd";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs from "@lib/dayjs";
import { BloodType, Gender } from "@models/enums";
import { patientPath } from "@router/paths";
import { PHONE_PATTERN } from "@utils/phone";
import { usePatientActions } from "../hooks/usePatients";
import type {
  ExistingPatientRef,
  Patient,
  PatientInput,
} from "../services/patientsService";
import {
  bloodTypeLabel,
  FIN_PATTERN,
  fullName,
  OLDEST_BIRTH_DATE,
} from "../utils/patient";
import { SimilarPatients } from "./SimilarPatients";
import styles from "./PatientModal.module.css";

interface PatientValues {
  firstName: string;
  lastName: string;
  fatherName: string;
  finCode: string;
  dateOfBirth: string | null; // YYYY-MM-DD
  gender: Gender | null;
  bloodType: BloodType | null;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes: string;
}

const EMPTY: PatientValues = {
  firstName: "",
  lastName: "",
  fatherName: "",
  finCode: "",
  dateOfBirth: null,
  gender: null,
  bloodType: null,
  phone: "",
  email: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  notes: "",
};

const toValues = (p: Patient): PatientValues => ({
  firstName: p.firstName,
  lastName: p.lastName,
  fatherName: p.fatherName ?? "",
  finCode: p.finCode ?? "",
  dateOfBirth: p.dateOfBirth,
  gender: p.gender,
  bloodType: p.bloodType,
  phone: p.phone,
  email: p.email ?? "",
  address: p.address ?? "",
  emergencyContactName: p.emergencyContactName ?? "",
  emergencyContactPhone: p.emergencyContactPhone ?? "",
  emergencyContactRelation: p.emergencyContactRelation ?? "",
  notes: p.notes ?? "",
});

// Optional text fields: an emptied one is sent as null
const OPTIONAL_TEXT = [
  "fatherName",
  "finCode",
  "email",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
  "notes",
] as const;
const REQUIRED_TEXT = ["firstName", "lastName", "phone"] as const;

const clean = (field: keyof PatientValues, value: string) => {
  const trimmed = value.trim();
  if (field === "finCode") return trimmed.toUpperCase();
  if (field === "email") return trimmed.toLowerCase();
  return trimmed;
};

// The whole input for a new patient, or only the changed fields of an edit
function toInput(v: PatientValues, before: PatientValues | null): Partial<PatientInput> {
  const input: Partial<PatientInput> = {};
  for (const field of REQUIRED_TEXT) {
    const value = clean(field, v[field]);
    if (!before || value !== before[field]) input[field] = value;
  }
  for (const field of OPTIONAL_TEXT) {
    const value = clean(field, v[field]);
    if (!before || value !== (before[field] ?? "")) input[field] = value || null;
  }
  if (!before || v.dateOfBirth !== before.dateOfBirth) input.dateOfBirth = v.dateOfBirth!;
  if (!before || v.gender !== before.gender) input.gender = v.gender!;
  if (!before || v.bloodType !== before.bloodType) input.bloodType = v.bloodType;
  return input;
}

// Register a patient (patient = null) or edit the demographics of one.
// While registering, possible duplicates (same name or FIN) show under the
// name fields; a FIN that is already taken names that patient.
export function PatientModal({
  open,
  patient: selected,
  onClose,
  onCreated,
}: {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onCreated?: (patient: Patient) => void;
}) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { create, update } = usePatientActions();
  // The patient who already has the FIN that was just rejected
  const [conflict, setConflict] = useState<{
    fin: string;
    patient: ExistingPatientRef;
  } | null>(null);
  // The last edited patient stays rendered while the modal animates out
  const [patient, setPatient] = useState(selected);
  if (selected && selected !== patient) setPatient(selected);
  const editing = Boolean(patient);

  const { control, handleSubmit, formState, setError, reset } = useForm<PatientValues>({
    mode: "onSubmit",
    values: patient ? toValues(patient) : EMPTY,
  });
  const [firstName, lastName, finCode] = useWatch({
    control,
    name: ["firstName", "lastName", "finCode"],
  });

  // Leave the form for an existing record (what was typed is lost)
  const openExisting = (existing: { id: string }) => {
    const go = () => {
      onClose();
      navigate(patientPath(existing.id));
    };
    if (!formState.isDirty) return go();
    modal.confirm({
      title: t("modal.discardTitle"),
      content: t("modal.discardText"),
      okText: t("patients.similar.discardAndOpen"),
      cancelText: t("modal.keepEditing"),
      onOk: go,
    });
  };

  const finTaken = (existing: ExistingPatientRef) => {
    setConflict({ fin: finCode.trim().toUpperCase(), patient: existing });
    setError("finCode", {
      message: t(
        existing.isActive ? "patients.form.finTaken" : "patients.form.finTakenInactive",
        { name: fullName(existing), mrn: existing.mrn },
      ),
    });
  };

  const onError = (error: unknown) => {
    if (isApiError(error, "CONFLICT")) {
      const details = error.details as { existingPatient?: ExistingPatientRef } | null;
      if (details?.existingPatient) return finTaken(details.existingPatient);
    }
    if (isApiError(error, "BUSINESS_RULE")) {
      const field = (error.details as { field?: string } | null)?.field;
      if (field === "dateOfBirth") {
        return setError("dateOfBirth", { message: t("patients.form.dobInvalid") });
      }
    }
    if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
  };

  const save = handleSubmit((v) => {
    if (patient) {
      update.mutate(
        { id: patient.id, input: toInput(v, toValues(patient)) },
        {
          onSuccess: () => {
            void message.success(t("patients.saved"));
            onClose();
          },
          onError,
        },
      );
      return;
    }
    create.mutate(toInput(v, null) as PatientInput, {
      onSuccess: (created) => {
        void message.success(
          t("patients.registered", { name: fullName(created), mrn: created.mrn }),
        );
        onCreated?.(created);
        onClose();
      },
      onError,
    });
  });

  const text = (
    name: keyof PatientValues,
    label: string,
    options: {
      required?: string;
      maxLength: number;
      placeholder?: string;
      pattern?: RegExp;
      patternMessage?: string;
      autoComplete?: string;
      upper?: boolean;
      extra?: ReactNode;
    },
  ) => (
    <FormField
      label={label}
      required={Boolean(options.required)}
      error={formState.errors[name]}
      htmlFor={`patient-${name}`}
      extra={options.extra}
    >
      <Controller
        name={name}
        control={control}
        rules={{
          validate: (value) => {
            const v = String(value ?? "").trim();
            if (!v) return options.required ?? true;
            if (
              options.pattern &&
              !options.pattern.test(options.upper ? v.toUpperCase() : v)
            )
              return options.patternMessage;
            return true;
          },
        }}
        render={({ field }) => (
          <Input
            {...field}
            value={String(field.value ?? "")}
            onChange={(event) =>
              field.onChange(
                options.upper ? event.target.value.toUpperCase() : event.target.value,
              )
            }
            id={`patient-${name}`}
            maxLength={options.maxLength}
            placeholder={options.placeholder}
            autoComplete={options.autoComplete ?? "off"}
            className={options.upper ? styles.code : undefined}
          />
        )}
      />
    </FormField>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      afterClose={() => {
        setPatient(null);
        setConflict(null);
        reset(EMPTY);
      }}
      title={t(editing ? "patients.form.editTitle" : "patients.form.createTitle")}
      description={
        patient ? `${fullName(patient)} · ${patient.mrn}` : t("patients.form.createText")
      }
      icon={editing ? <EditOutlined /> : <UserAddOutlined />}
      size="lg"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t(editing ? "common.save" : "patients.form.register"),
        disabled: editing && !formState.isDirty,
        loading: create.isPending || update.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <h3 className={styles.section}>{t("patients.form.personal")}</h3>
        <div className={styles.row3}>
          {text("firstName", t("patients.fields.firstName"), {
            required: t("patients.form.firstNameRequired"),
            maxLength: 100,
          })}
          {text("lastName", t("patients.fields.lastName"), {
            required: t("patients.form.lastNameRequired"),
            maxLength: 100,
          })}
          {text("fatherName", t("patients.fields.fatherName"), { maxLength: 100 })}
        </div>
        {!editing && (
          <SimilarPatients
            firstName={firstName}
            lastName={lastName}
            finCode={finCode}
            onOpen={openExisting}
          />
        )}
        <div className={styles.rowIdentity}>
          <FormField
            label={t("patients.fields.dateOfBirth")}
            required
            error={formState.errors.dateOfBirth}
            htmlFor="patient-dateOfBirth"
          >
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{ required: t("patients.form.dobRequired") }}
              render={({ field }) => (
                <DatePicker
                  id="patient-dateOfBirth"
                  className={styles.full}
                  format="DD.MM.YYYY"
                  placeholder="DD.MM.YYYY"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(day) =>
                    field.onChange(day ? day.format("YYYY-MM-DD") : null)
                  }
                  onBlur={field.onBlur}
                  disabledDate={(day) =>
                    day.isAfter(dayjs(), "day") || day.isBefore(dayjs(OLDEST_BIRTH_DATE))
                  }
                />
              )}
            />
          </FormField>
          <FormField
            label={t("patients.fields.gender")}
            required
            error={formState.errors.gender}
          >
            <Controller
              name="gender"
              control={control}
              rules={{ required: t("patients.form.genderRequired") }}
              render={({ field }) => (
                <Radio.Group
                  optionType="button"
                  className={styles.segmented}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  options={Object.values(Gender).map((g) => ({
                    value: g,
                    label: t(`patients.gender.${g}`),
                  }))}
                  aria-label={t("patients.fields.gender")}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("patients.fields.bloodType")}
            error={formState.errors.bloodType}
            htmlFor="patient-bloodType"
          >
            <Controller
              name="bloodType"
              control={control}
              render={({ field }) => (
                <Select<BloodType>
                  id="patient-bloodType"
                  allowClear
                  placeholder={t("patients.form.bloodUnknown")}
                  value={field.value ?? undefined}
                  onChange={(value) => field.onChange(value ?? null)}
                  options={Object.values(BloodType).map((b) => ({
                    value: b,
                    label: bloodTypeLabel(b),
                  }))}
                />
              )}
            />
          </FormField>
          {text("finCode", t("patients.fields.finCode"), {
            maxLength: 7,
            placeholder: "5ZK8L2M",
            pattern: FIN_PATTERN,
            patternMessage: t("patients.form.finInvalid"),
            upper: true,
            extra: conflict && conflict.fin === finCode.trim().toUpperCase() && (
              <button
                type="button"
                className={styles.finLink}
                onClick={() => openExisting(conflict.patient)}
              >
                {t("patients.similar.openRecord")}
              </button>
            ),
          })}
        </div>

        <h3 className={styles.section}>{t("patients.form.contact")}</h3>
        <div className={styles.row2}>
          {text("phone", t("patients.fields.phone"), {
            required: t("patients.form.phoneRequired"),
            maxLength: 20,
            placeholder: "+994 50 123 45 67",
            pattern: PHONE_PATTERN,
            patternMessage: t("patients.form.phoneInvalid"),
            autoComplete: "tel",
          })}
          {text("email", t("patients.fields.email"), {
            maxLength: 255,
            placeholder: "name@mail.az",
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            patternMessage: t("patients.form.emailInvalid"),
            autoComplete: "email",
          })}
        </div>
        <FormField
          label={t("patients.fields.address")}
          error={formState.errors.address}
          htmlFor="patient-address"
        >
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="patient-address"
                maxLength={500}
                autoComplete="street-address"
              />
            )}
          />
        </FormField>

        <h3 className={styles.section}>{t("patients.form.emergency")}</h3>
        <div className={styles.row3}>
          {text("emergencyContactName", t("patients.fields.emergencyContactName"), {
            maxLength: 150,
          })}
          {text("emergencyContactPhone", t("patients.fields.emergencyContactPhone"), {
            maxLength: 20,
            placeholder: "+994 55 123 45 67",
            pattern: PHONE_PATTERN,
            patternMessage: t("patients.form.phoneInvalid"),
          })}
          {text(
            "emergencyContactRelation",
            t("patients.fields.emergencyContactRelation"),
            { maxLength: 50, placeholder: t("patients.form.relationPlaceholder") },
          )}
        </div>

        <FormField
          label={t("patients.fields.notes")}
          error={formState.errors.notes}
          htmlFor="patient-notes"
          extra={t("patients.form.notesHint")}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="patient-notes"
                maxLength={2000}
                autoSize={{ minRows: 2, maxRows: 5 }}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
