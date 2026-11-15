import { StopOutlined } from "@ant-design/icons";
import { App, Form, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { useLastDefined } from "@hooks/useLastDefined";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useAppointmentActions } from "../hooks/useAppointments";
import type { Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import styles from "./AppointmentModals.module.css";

// Cancel with a reason. Nothing is deleted: the appointment stays in the
// list as cancelled and its time becomes free for others.
export function CancelAppointmentModal({
  appointment: selected,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { cancel } = useAppointmentActions();
  const appointment = useLastDefined(selected);
  const { control, handleSubmit, formState, setError, reset } = useForm<{
    reason: string;
  }>({ mode: "onSubmit", defaultValues: { reason: "" } });

  const save = handleSubmit(({ reason }) => {
    if (!appointment) return;
    cancel.mutate(
      { id: appointment.id, reason: reason.trim() },
      {
        onSuccess: (a) => {
          void message.success(t("appointments.cancel.done", { name: a.patientName }));
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
      afterClose={() => reset({ reason: "" })}
      title={t("appointments.cancel.title")}
      description={
        appointment &&
        `${appointment.patientName} · ${dayLabel(appointment.startsAt)}, ${timeRange(appointment.startsAt, appointment.endsAt)}`
      }
      icon={<StopOutlined />}
      tone="danger"
      size="md"
      onSubmit={(event) => void save(event)}
      dirty={formState.isDirty}
      cancelText={t("appointments.cancel.keep")}
      primaryAction={{
        label: t("appointments.cancel.submit"),
        danger: true,
        loading: cancel.isPending,
      }}
    >
      <p className={styles.consequence}>{t("appointments.cancel.consequence")}</p>
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("appointments.cancel.reason")}
          required
          error={formState.errors.reason}
          htmlFor="cancel-reason"
        >
          <Controller
            name="reason"
            control={control}
            rules={{
              validate: (v) =>
                Boolean(v.trim()) || t("appointments.cancel.reasonRequired"),
            }}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="cancel-reason"
                maxLength={500}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder={t("appointments.cancel.reasonPlaceholder")}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
