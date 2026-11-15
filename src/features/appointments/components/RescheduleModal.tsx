import { FieldTimeOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Select } from "antd";
import type { Dayjs } from "dayjs";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { useDoctors } from "@features/staff/hooks/useStaff";
import { useLastDefined } from "@hooks/useLastDefined";
import { isApiError } from "@lib/api/errors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { CLINIC_TZ, toClinicTime } from "@lib/dayjs";
import { useAppointmentActions, useAvailability } from "../hooks/useAppointments";
import { MAX_DAYS_AHEAD, type Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import { SlotPicker } from "./SlotPicker";
import styles from "./AppointmentModals.module.css";
import bookStyles from "./BookAppointmentModal.module.css";

interface MoveValues {
  departmentId: string | null;
  doctorId: string | null;
  date: Dayjs | null;
  startsAt: string | null;
}

const clinicToday = () => dayjs().tz(CLINIC_TZ).startOf("day");

// The appointment's own day if it is still ahead, else today
const toValues = (a: Appointment | null): MoveValues => {
  const day = a ? toClinicTime(a.startsAt).startOf("day") : clinicToday();
  return {
    departmentId: null,
    doctorId: a?.doctorId ?? null,
    date: day.isBefore(clinicToday(), "day")
      ? clinicToday()
      : dayjs(day.format("YYYY-MM-DD")),
    startsAt: null,
  };
};

// Move an appointment to another free time, optionally to another doctor.
// The server checks every booking rule again; the current time is marked
// in the slots so the desk sees where it is now.
export function RescheduleModal({
  appointment: selected,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { reschedule } = useAppointmentActions();
  const appointment = useLastDefined(selected);
  const open = Boolean(selected);
  const { control, handleSubmit, formState, setError, clearErrors, setValue } =
    useForm<MoveValues>({ mode: "onSubmit", values: toValues(appointment) });
  const [departmentId, doctorId, date] = useWatch({
    control,
    name: ["departmentId", "doctorId", "date"],
  });

  const doctors = useDoctors(departmentId ?? undefined, open);
  const doctorOptions = useMemo(() => {
    const list = (doctors.data ?? []).map((d) => ({
      value: d.userId,
      label: `${d.firstName} ${d.lastName}`,
      department: d.department,
      search: `${d.firstName} ${d.lastName} ${d.department?.name ?? ""}`,
    }));
    // The current doctor stays visible even if filtered out / deactivated
    if (
      appointment &&
      !departmentId &&
      !list.some((o) => o.value === appointment.doctorId)
    ) {
      list.unshift({
        value: appointment.doctorId,
        label: appointment.doctorName,
        department: null,
        search: appointment.doctorName,
      });
    }
    return list;
  }, [doctors.data, appointment, departmentId]);

  const day = date ? date.format("YYYY-MM-DD") : null;
  const availability = useAvailability(
    open && appointment && doctorId && day
      ? { doctorId, date: day, patientId: appointment.patientId }
      : null,
  );
  const sameDoctor = doctorId === appointment?.doctorId;

  const pickAgain = (text: string) => {
    setValue("startsAt", null);
    setError("startsAt", { type: "server", message: text });
    void availability.refetch();
  };

  const save = handleSubmit((v) => {
    if (!appointment) return;
    reschedule.mutate(
      {
        id: appointment.id,
        input: {
          startsAt: v.startsAt!,
          ...(v.doctorId !== appointment.doctorId ? { doctorId: v.doctorId! } : {}),
        },
      },
      {
        onSuccess: (moved) => {
          void message.success(
            t("appointments.reschedule.done", {
              name: moved.patientName,
              time: toClinicTime(moved.startsAt).format("DD MMM, HH:mm"),
              doctor: moved.doctorName,
            }),
          );
          onClose();
        },
        onError: (error) => {
          const details = (isApiError(error) ? error.details : null) as {
            field?: string;
            reason?: string;
            conflict?: string;
          } | null;
          if (isApiError(error, "SLOT_TAKEN")) {
            pickAgain(
              t(
                details?.conflict === "PATIENT"
                  ? "appointments.book.patientBusy"
                  : "appointments.book.slotTaken",
              ),
            );
          } else if (details?.field === "startsAt") {
            pickAgain(
              t(`appointments.rules.${details.reason ?? "unknown"}`, {
                defaultValue: errorMessage(error),
              }),
            );
          } else if (details?.field === "doctorId") {
            setError("doctorId", { type: "server", message: errorMessage(error) });
          } else {
            void message.error(errorMessage(error));
          }
        },
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("appointments.reschedule.title")}
      description={appointment?.patientName}
      icon={<FieldTimeOutlined />}
      size="lg"
      onSubmit={(event) => void save(event)}
      dirty={formState.dirtyFields.startsAt === true}
      primaryAction={{
        label: t("appointments.reschedule.submit"),
        loading: reschedule.isPending,
      }}
    >
      {appointment && (
        <div className={styles.currentCard}>
          <span className={styles.currentLabel}>{t("appointments.reschedule.now")}</span>
          <span className={styles.currentValue}>
            {dayLabel(appointment.startsAt)},{" "}
            {timeRange(appointment.startsAt, appointment.endsAt)}
          </span>
          <span className={styles.currentLabel}>·</span>
          <span>{appointment.doctorName}</span>
        </div>
      )}
      <Form layout="vertical" requiredMark={false} component="div">
        <div className={styles.row2}>
          <FormField label={t("appointments.fields.department")} htmlFor="move-dept">
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <DepartmentSelect
                  id="move-dept"
                  allowClear
                  placeholder={t("appointments.book.anyDepartment")}
                  value={field.value ?? undefined}
                  onChange={(value) => {
                    field.onChange(value ?? null);
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
            htmlFor="move-doctor"
          >
            <Controller
              name="doctorId"
              control={control}
              rules={{ required: t("appointments.book.doctorRequired") }}
              render={({ field, fieldState }) => (
                <Select<string>
                  id="move-doctor"
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
                    <span className={bookStyles.doctorOption}>
                      <span>{option.label}</span>
                      {option.data.department && (
                        <span className={bookStyles.doctorOptionDept}>
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
        <FormField label={t("appointments.fields.date")} required htmlFor="move-date">
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="move-date"
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
        <FormField
          label={t("appointments.reschedule.newTime")}
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
                currentStartsAt={sameDoctor ? appointment?.startsAt : undefined}
              />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
