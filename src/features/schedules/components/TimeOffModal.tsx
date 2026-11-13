import { PlusOutlined } from "@ant-design/icons";
import { App, DatePicker, Form, Input, Select } from "antd";
import type { Dayjs } from "dayjs";
import { Controller, useForm, useWatch, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppModal } from "@components/modal";
import { FormField } from "@components/ui/FormField";
import { isApiError } from "@lib/api/errors";
import { applyFieldErrors } from "@lib/api/formErrors";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useTimeOffActions } from "../hooks/useTimeOff";
import { TIME_OFF_TYPES, type TimeOffType } from "../services/timeOffService";
import { daysBetween, MAX_TIME_OFF_DAYS } from "../utils/timeOff";
import { TimeOffTypeTag } from "./TimeOffTypeTag";

interface Values {
  type: TimeOffType;
  period: [Dayjs, Dayjs] | null;
  reason: string;
}

const EMPTY: Values = { type: "VACATION", period: null, reason: "" };

// Add a leave period for one doctor (schedules.manage)
export function TimeOffModal({
  open,
  userId,
  doctorName,
  onClose,
}: {
  open: boolean;
  userId: string;
  doctorName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { create } = useTimeOffActions();
  const { control, handleSubmit, formState, reset, setError } = useForm<Values>({
    mode: "onSubmit",
    defaultValues: EMPTY,
  });
  const period = useWatch({ control, name: "period" });
  const days = period
    ? daysBetween(period[0].format("YYYY-MM-DD"), period[1].format("YYYY-MM-DD"))
    : 0;

  const submit = handleSubmit((v) => {
    if (!v.period) return;
    create.mutate(
      {
        userId,
        type: v.type,
        startDate: v.period[0].format("YYYY-MM-DD"),
        endDate: v.period[1].format("YYYY-MM-DD"),
        reason: v.reason.trim() || null,
      },
      {
        onSuccess: () => {
          void message.success(t("timeOff.added"));
          onClose();
        },
        onError: (error) => {
          if (isApiError(error, "CONFLICT")) {
            setError("period", { message: t("timeOff.overlap") });
            return;
          }
          if (
            !applyFieldErrors(error, setError, {
              startDate: "period",
              endDate: "period",
            })
          ) {
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
      afterClose={() => reset(EMPTY)}
      title={t("timeOff.addTitle")}
      description={t("timeOff.addText", { name: doctorName })}
      icon={<PlusOutlined />}
      onSubmit={(event) => void submit(event)}
      dirty={formState.isDirty}
      primaryAction={{
        label: t("timeOff.addButton"),
        icon: <PlusOutlined />,
        loading: create.isPending,
      }}
    >
      <Form layout="vertical" requiredMark={false} component="div">
        <FormField
          label={t("timeOff.type")}
          error={formState.errors.type}
          htmlFor="time-off-type"
        >
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="time-off-type"
                options={TIME_OFF_TYPES.map((type) => ({
                  value: type,
                  label: <TimeOffTypeTag type={type} />,
                }))}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("timeOff.period")}
          // A tuple field: RHF types its error per item; ours is one message
          error={formState.errors.period as FieldError | undefined}
          extra={
            days > 0 ? t("timeOff.daysCount", { count: days }) : t("timeOff.periodHint")
          }
          htmlFor="time-off-period"
        >
          <Controller
            name="period"
            control={control}
            rules={{
              validate: (value) => {
                if (!value) return t("timeOff.periodRequired");
                const length = daysBetween(
                  value[0].format("YYYY-MM-DD"),
                  value[1].format("YYYY-MM-DD"),
                );
                return (
                  length <= MAX_TIME_OFF_DAYS ||
                  t("timeOff.tooLong", { max: MAX_TIME_OFF_DAYS })
                );
              },
            }}
            render={({ field }) => (
              <DatePicker.RangePicker
                id="time-off-period"
                value={field.value}
                onChange={(dates) =>
                  field.onChange(
                    dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null,
                  )
                }
                format="DD.MM.YYYY"
                placeholder={[t("common.from"), t("common.to")]}
                style={{ width: "100%" }}
              />
            )}
          />
        </FormField>
        <FormField
          label={t("timeOff.reason")}
          error={formState.errors.reason}
          extra={t("timeOff.reasonHint")}
          htmlFor="time-off-reason"
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Input {...field} id="time-off-reason" maxLength={255} />
            )}
          />
        </FormField>
      </Form>
    </AppModal>
  );
}
