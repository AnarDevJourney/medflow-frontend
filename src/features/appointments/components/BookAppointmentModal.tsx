import { AlertOutlined, CalendarOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Input, Radio, Select } from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { usePatient } from "@features/patients/hooks/usePatients";
import { ageOf, fullName } from "@features/patients/utils/patient";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { useDoctors } from "@features/staff/hooks/useStaff";
import { applyFieldErrors } from "@lib/api/formErrors";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { CLINIC_TZ, toClinicTime } from "@lib/dayjs";
import { useAppointmentActions, useAvailability } from "../hooks/useAppointments";
import {
  AppointmentType,
  MAX_DAYS_AHEAD,
  type Appointment,
} from "../services/appointmentsService";
import { PatientPicker, type PatientRef } from "./PatientPicker";
import { SlotPicker } from "./SlotPicker";
import styles from "./BookAppointmentModal.module.css";

interface BookValues {
  patient: PatientRef | null;
  departmentId: string | null;
  doctorId: string | null;
  date: Dayjs | null;
  startsAt: string | null;
  type: AppointmentType;
  reason: string;
  notes: string;
}

const clinicToday = () => dayjs().tz(CLINIC_TZ).startOf("day");

// A slot chosen beforehand (a click on the calendar)
export interface PresetSlot {
  doctorId: string;
  departmentId: string | null;
  date: string; // YYYY-MM-DD
  startsAt: string;
}

const emptyValues = (
  patient: PatientRef | null,
  slot?: PresetSlot | null,
): BookValues => ({
  patient,
  departmentId: slot?.departmentId ?? null,
  doctorId: slot?.doctorId ?? null,
  date: slot ? dayjs(slot.date) : clinicToday(),
  startsAt: slot?.startsAt ?? null,
  type: AppointmentType.CONSULTATION,
  reason: "",
  notes: "",
});

// Book a patient into a free slot (DOC 6.2): patient → department / doctor
// → day → one of the doctor's free times. The slots come live from the
// server; if another desk takes the time first, the server answers 409 and
// the slots refresh.
export function BookAppointmentModal({
  open,
  onClose,
  patient: initialPatient = null,
  slot = null,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  // Booking from a patient's profile starts with that patient
  patient?: PatientRef | null;
  // Booking from a calendar slot starts with that doctor, day and time
  slot?: PresetSlot | null;
  onBooked?: (appointment: Appointment) => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const can = useCan();
  const { create } = useAppointmentActions();
  const { control, handleSubmit, formState, setError, clearErrors, setValue, reset } =
    useForm<BookValues>({
      mode: "onSubmit",
      defaultValues: emptyValues(initialPatient),
    });
  // Opened from a calendar slot: that doctor (and department) is fixed
  const locked = Boolean(slot);
  // Every opening starts from the given patient / slot
  useEffect(() => {
    if (open) reset(emptyValues(initialPatient, slot));
  }, [open, reset, initialPatient, slot]);
  const [patient, departmentId, doctorId, date, startsAt] = useWatch({
    control,
    name: ["patient", "departmentId", "doctorId", "date", "startsAt"],
  });

  const doctors = useDoctors(departmentId ?? undefined, open);
  const doctorOptions = useMemo(
    () =>
      (doctors.data ?? []).map((d) => ({
        value: d.userId,
        label: `${d.firstName} ${d.lastName}`,
        department: d.department,
        search: `${d.firstName} ${d.lastName} ${d.department?.name ?? ""}`,
      })),
    [doctors.data],
  );

  const day = date ? date.format("YYYY-MM-DD") : null;
  const availability = useAvailability(
    open && doctorId && day ? { doctorId, date: day, patientId: patient?.id } : null,
  );

  // The slots changed (another patient chosen, refetch): a chosen time that
  // is no longer free is dropped, with the reason under the slots
  const chosenSlot =
    startsAt && availability.data?.working
      ? availability.data.slots.find(
          (s) => new Date(s.startsAt).getTime() === new Date(startsAt).getTime(),
        )
      : undefined;
  const blockedReason =
    chosenSlot && !chosenSlot.available ? chosenSlot.reason : undefined;
  useEffect(() => {
    if (!blockedReason) return;
    setValue("startsAt", null);
    setError("startsAt", {
      type: "slot",
      message: t(
        blockedReason === "PATIENT_BUSY"
          ? "appointments.book.patientBusy"
          : blockedReason === "TAKEN"
            ? "appointments.book.slotTaken"
            : "appointments.book.timeRequired",
      ),
    });
  }, [blockedReason, setValue, setError, t]);

  // Clinical readers see the allergies of the chosen patient at a glance
  const profile = usePatient(
    open && patient && can("patients.clinical_read") ? patient.id : undefined,
  );
  const allergyCount = profile.data?.allergies?.length ?? 0;

  const pickSlotAgain = (text: string) => {
    setValue("startsAt", null);
    setError("startsAt", { type: "server", message: text });
    void availability.refetch();
  };

  const onError = (error: unknown) => {
    if (isApiError(error, "SLOT_TAKEN")) {
      const conflict = (error.details as { conflict?: string } | null)?.conflict;
      pickSlotAgain(
        t(
          conflict === "PATIENT"
            ? "appointments.book.patientBusy"
            : "appointments.book.slotTaken",
        ),
      );
      return;
    }
    const details = (isApiError(error) ? error.details : null) as {
      field?: string;
      reason?: string;
    } | null;
    if (isApiError(error, "BUSINESS_RULE") && details?.field === "startsAt") {
      pickSlotAgain(
        t(`appointments.rules.${details.reason ?? "unknown"}`, {
          defaultValue: errorMessage(error),
        }),
      );
      return;
    }
    if (isApiError(error, "INVALID_STATUS") && details?.field === "patientId") {
      setError("patient", { type: "server", message: t("appointments.book.inactive") });
      return;
    }
    if (isApiError(error, "NOT_FOUND") && details?.field === "patientId") {
      setError("patient", { type: "server", message: errorMessage(error) });
      return;
    }
    if (isApiError(error, "NOT_FOUND") && details?.field === "doctorId") {
      setError("doctorId", { type: "server", message: errorMessage(error) });
      return;
    }
    if (!applyFieldErrors(error, setError, { patientId: "patient" })) {
      void message.error(errorMessage(error));
    }
  };

  const save = handleSubmit((v) => {
    create.mutate(
      {
        patientId: v.patient!.id,
        doctorId: v.doctorId!,
        startsAt: v.startsAt!,
        type: v.type,
        reason: v.reason.trim() || null,
        notes: v.notes.trim() || null,
      },
      {
        onSuccess: (booked) => {
          void message.success(
            t("appointments.book.booked", {
              name: booked.patientName,
              time: toClinicTime(booked.startsAt).format("DD MMM, HH:mm"),
              doctor: booked.doctorName,
            }),
          );
          onBooked?.(booked);
          onClose();
        },
        onError,
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      afterClose={() => reset(emptyValues(initialPatient))}
      title={t("appointments.book.title")}
      description={t("appointments.book.description")}
      icon={<CalendarOutlined />}
      size="lg"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t("appointments.book.submit"),
        loading: create.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("appointments.fields.patient")}
          required
          error={formState.errors.patient as FieldError | undefined}
          htmlFor="book-patient"
        >
          <Controller
            name="patient"
            control={control}
            rules={{ required: t("appointments.book.patientRequired") }}
            render={({ field, fieldState }) => (
              <PatientPicker
                id="book-patient"
                value={field.value}
                onChange={(next) => {
                  // The chosen time stays; it is dropped below only if this
                  // patient turns out to be busy then
                  field.onChange(next);
                }}
                status={fieldState.error ? "error" : undefined}
              />
            )}
          />
        </FormField>
        {patient && (
          <div className={styles.patientCard}>
            <span className={styles.patientCardName}>{fullName(patient)}</span>
            <span className={styles.mrn}>{patient.mrn}</span>
            <span className={styles.patientCardMeta}>
              {t("patients.years", { count: ageOf(patient.dateOfBirth) })} ·{" "}
              {patient.phone}
            </span>
            {allergyCount > 0 && (
              <span className={styles.allergyChip}>
                <AlertOutlined aria-hidden="true" />
                {t("appointments.book.allergies", { count: allergyCount })}
              </span>
            )}
          </div>
        )}

        <div className={styles.row2}>
          <FormField label={t("appointments.fields.department")} htmlFor="book-dept">
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <DepartmentSelect
                  id="book-dept"
                  disabled={locked}
                  allowClear
                  placeholder={t("appointments.book.anyDepartment")}
                  value={field.value ?? undefined}
                  onChange={(value) => {
                    field.onChange(value ?? null);
                    // A doctor of another department no longer fits
                    const doctor = doctorOptions.find((d) => d.value === doctorId);
                    if (value && doctor && doctor.department?.id !== value) {
                      setValue("doctorId", null);
                      setValue("startsAt", null);
                    }
                  }}
                />
              )}
            />
          </FormField>
          <FormField
            label={t("appointments.fields.doctor")}
            required
            error={formState.errors.doctorId}
            htmlFor="book-doctor"
          >
            <Controller
              name="doctorId"
              control={control}
              rules={{ required: t("appointments.book.doctorRequired") }}
              render={({ field, fieldState }) => (
                <Select<string>
                  id="book-doctor"
                  disabled={locked}
                  showSearch={{ optionFilterProp: "search" }}
                  placeholder={t("appointments.book.doctorPlaceholder")}
                  loading={doctors.isLoading}
                  status={fieldState.error ? "error" : undefined}
                  value={field.value ?? undefined}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("startsAt", null);
                    clearErrors("startsAt");
                  }}
                  options={doctorOptions}
                  optionRender={(option) => (
                    <span className={styles.doctorOption}>
                      <span>{option.label}</span>
                      {option.data.department && (
                        <span className={styles.doctorOptionDept}>
                          {option.data.department.name}
                        </span>
                      )}
                    </span>
                  )}
                  notFoundContent={t("appointments.book.noDoctors")}
                />
              )}
            />
          </FormField>
        </div>

        <div className={styles.row2}>
          <FormField label={t("appointments.fields.date")} required htmlFor="book-date">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="book-date"
                  format="dd, DD MMM YYYY"
                  allowClear={false}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("startsAt", null);
                    clearErrors("startsAt");
                  }}
                  disabledDate={(d) =>
                    d.isBefore(clinicToday(), "day") ||
                    d.isAfter(clinicToday().add(MAX_DAYS_AHEAD, "day"), "day")
                  }
                  className={styles.full}
                />
              )}
            />
          </FormField>
          <FormField label={t("appointments.fields.type")}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Radio.Group
                  optionType="button"
                  className={styles.segmented}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  options={Object.values(AppointmentType).map((type) => ({
                    value: type,
                    label: t(`appointments.types.${type}`),
                  }))}
                  aria-label={t("appointments.fields.type")}
                />
              )}
            />
          </FormField>
        </div>

        <FormField
          label={t("appointments.fields.time")}
          required
          error={formState.errors.startsAt}
        >
          <Controller
            name="startsAt"
            control={control}
            rules={{ required: t("appointments.book.timeRequired") }}
            render={({ field, fieldState }) => (
              <SlotPicker
                ready={Boolean(doctorId && day)}
                loading={availability.isFetching && !availability.data}
                error={availability.error}
                data={availability.data}
                value={field.value}
                onChange={(startsAt) => {
                  field.onChange(startsAt);
                  clearErrors("startsAt");
                }}
                onRetry={() => void availability.refetch()}
                invalid={Boolean(fieldState.error)}
              />
            )}
          />
        </FormField>

        <FormField
          label={t("appointments.fields.reason")}
          error={formState.errors.reason}
          htmlFor="book-reason"
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="book-reason"
                maxLength={500}
                placeholder={t("appointments.book.reasonPlaceholder")}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("appointments.fields.notes")}
          error={formState.errors.notes}
          htmlFor="book-notes"
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="book-notes"
                maxLength={2000}
                autoSize={{ minRows: 2, maxRows: 5 }}
                placeholder={t("appointments.book.notesPlaceholder")}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
