import { EditOutlined } from "@ant-design/icons";
import { App, Form, Input, Radio } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { useLastDefined } from "@hooks/useLastDefined";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useAppointmentActions } from "../hooks/useAppointments";
import {
  AppointmentType,
  type Appointment,
  type AppointmentEdit,
} from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import styles from "./AppointmentModals.module.css";

interface EditValues {
  type: AppointmentType;
  reason: string;
  notes: string;
}

const toValues = (a: Appointment | null): EditValues => ({
  type: a?.type ?? AppointmentType.CONSULTATION,
  reason: a?.reason ?? "",
  notes: a?.notes ?? "",
});

// Visit type, reason and notes. Time and doctor change through
// "Reschedule"; the patient never changes (cancel and book again).
export function EditAppointmentModal({
  appointment: selected,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { update } = useAppointmentActions();
  const appointment = useLastDefined(selected);
  const { control, handleSubmit, formState, setError } = useForm<EditValues>({
    mode: "onSubmit",
    values: toValues(appointment),
  });

  // Only the changed fields are sent
  const save = handleSubmit((v) => {
    if (!appointment) return;
    const before = toValues(appointment);
    const input: AppointmentEdit = {};
    if (v.type !== before.type) input.type = v.type;
    if (v.reason.trim() !== before.reason) input.reason = v.reason.trim() || null;
    if (v.notes.trim() !== before.notes) input.notes = v.notes.trim() || null;
    update.mutate(
      { id: appointment.id, input },
      {
        onSuccess: () => {
          void message.success(t("appointments.edit.saved"));
          onClose();
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) void message.error(errorMessage(error));
        },
      },
    );
  });

  return (
    <AppModal
      open={Boolean(selected)}
      onClose={onClose}
      title={t("appointments.edit.title")}
      description={
        appointment &&
        `${appointment.patientName} · ${dayLabel(appointment.startsAt)}, ${timeRange(appointment.startsAt, appointment.endsAt)}`
      }
      icon={<EditOutlined />}
      size="md"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t("common.save"),
        disabled: !formState.isDirty,
        loading: update.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
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
        <FormField
          label={t("appointments.fields.reason")}
          error={formState.errors.reason}
          htmlFor="edit-reason"
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="edit-reason"
                maxLength={500}
                placeholder={t("appointments.book.reasonPlaceholder")}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("appointments.fields.notes")}
          error={formState.errors.notes}
          htmlFor="edit-notes"
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="edit-notes"
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
