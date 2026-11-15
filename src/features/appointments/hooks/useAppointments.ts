import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAppointment,
  getAppointment,
  getAvailability,
  listAppointments,
  type AppointmentInput,
  type AppointmentsQuery,
  type AvailabilityQuery,
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

export function useAppointmentActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: appointmentsKey });

  return {
    create: useMutation({
      mutationFn: (input: AppointmentInput) => createAppointment(input),
      onSettled: done,
    }),
  };
}
