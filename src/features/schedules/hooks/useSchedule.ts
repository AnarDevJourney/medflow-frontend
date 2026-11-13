import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSchedule,
  replaceSchedule,
  type ScheduleDay,
} from "../services/schedulesService";

export const scheduleKey = (userId: string) => ["schedules", userId] as const;

export function useSchedule(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: scheduleKey(userId ?? ""),
    queryFn: () => getSchedule(userId!),
    enabled: Boolean(userId) && enabled,
  });
}

export function useReplaceSchedule(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (days: ScheduleDay[]) => replaceSchedule(userId, days),
    onSuccess: (schedule) => queryClient.setQueryData(scheduleKey(userId), schedule),
  });
}
