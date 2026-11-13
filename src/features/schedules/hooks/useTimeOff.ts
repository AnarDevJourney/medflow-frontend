import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTimeOff,
  deleteTimeOff,
  listTimeOff,
  type CreateTimeOffInput,
  type TimeOffQuery,
} from "../services/timeOffService";

export const timeOffKey = ["time-off"] as const;

export function useTimeOff(query: TimeOffQuery, enabled = true) {
  return useQuery({
    queryKey: [...timeOffKey, query],
    queryFn: () => listTimeOff(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTimeOffActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: timeOffKey });
  return {
    create: useMutation({
      mutationFn: (input: CreateTimeOffInput) => createTimeOff(input),
      onSettled: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteTimeOff(id),
      onSettled: done,
    }),
  };
}
