import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelAppointment,
  checkInAppointment,
  createAppointment,
  getAppointment,
  getAvailability,
  getCalendar,
  listAppointments,
  listTodayAppointments,
  rescheduleAppointment,
  updateAppointment,
  type AppointmentEdit,
  type AppointmentInput,
  type AppointmentsQuery,
  type AvailabilityQuery,
  type CalendarQuery,
} from "../services/appointmentsService";

export const appointmentsKey = ["appointments"] as const;

export function useAppointments(query: AppointmentsQuery, enabled = true) {
  return useQuery({
    queryKey: [...appointmentsKey, "list", query],
    queryFn: () => listAppointments(query),
    placeholderData: keepPreviousData, // no empty flash between pages / filters
    enabled,
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: [...appointmentsKey, "one", id],
    queryFn: () => getAppointment(id!),
    enabled: Boolean(id),
  });
}

// Slots of one doctor day; refetched on focus so a slot booked at another
// desk shows up taken without a reload
export function useAvailability(query: AvailabilityQuery | null) {
  return useQuery({
    queryKey: [...appointmentsKey, "availability", query],
    queryFn: () => getAvailability(query!),
    enabled: Boolean(query),
    staleTime: 0,
  });
}

// Day / week calendar. Refreshed every 30 s and when the tab comes back,
// so bookings made at another desk show up without a reload.
export function useCalendar(query: CalendarQuery | null) {
  return useQuery({
    queryKey: [...appointmentsKey, "calendar", query],
    queryFn: () => getCalendar(query!),
    enabled: Boolean(query),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useTodayAppointments(
  query: { departmentId?: string; doctorId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: [...appointmentsKey, "today", query],
    queryFn: () => listTodayAppointments(query),
    enabled,
  });
}

export function useAppointmentActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: appointmentsKey });

  return {
    create: useMutation({
      mutationFn: (input: AppointmentInput) => createAppointment(input),
      onSettled: done,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: AppointmentEdit }) =>
        updateAppointment(id, input),
      onSettled: done,
    }),
    reschedule: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: { startsAt: string; doctorId?: string };
      }) => rescheduleAppointment(id, input),
      onSettled: done,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        cancelAppointment(id, reason),
      onSettled: done,
    }),
    checkIn: useMutation({
      mutationFn: (id: string) => checkInAppointment(id),
      onSettled: done,
    }),
  };
}
