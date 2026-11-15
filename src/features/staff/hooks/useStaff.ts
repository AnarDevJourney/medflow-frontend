import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  getMyStaffProfile,
  getStaffMember,
  listDoctors,
  listStaff,
  updateMyStaffProfile,
  updateStaff,
  type StaffQuery,
  type UpdateOwnStaffInput,
  type UpdateStaffInput,
} from "../services/staffService";

export const staffKey = ["staff"] as const;
export const myStaffProfileKey = [...staffKey, "me"] as const;

export function useStaff(query: StaffQuery) {
  return useQuery({
    queryKey: [...staffKey, "list", query],
    queryFn: () => listStaff(query),
    placeholderData: keepPreviousData, // no empty flash between pages / filters
  });
}

export function useStaffMember(userId: string | undefined) {
  return useQuery({
    queryKey: [...staffKey, "one", userId],
    queryFn: () => getStaffMember(userId!),
    enabled: Boolean(userId),
  });
}

// Doctors for booking pickers (all, or one department's), by name
export function useDoctors(departmentId?: string, enabled = true) {
  return useQuery({
    queryKey: [...staffKey, "doctors", departmentId ?? null],
    queryFn: () => listDoctors(departmentId),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useMyStaffProfile(enabled = true) {
  return useQuery({ queryKey: myStaffProfileKey, queryFn: getMyStaffProfile, enabled });
}

// Account changes (invite, rename, role, deactivate) reach staff-service
// through Kafka a moment after auth answers. Refetch now and twice more
// shortly after, so the directory catches up without a reload.
export function refreshStaffSoon(queryClient: QueryClient) {
  const refresh = () => void queryClient.invalidateQueries({ queryKey: staffKey });
  refresh();
  window.setTimeout(refresh, 1200);
  window.setTimeout(refresh, 4000);
}

export function useStaffActions() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: staffKey });

  return {
    update: useMutation({
      mutationFn: ({ userId, input }: { userId: string; input: UpdateStaffInput }) =>
        updateStaff(userId, input),
      onSettled: done,
    }),
    updateMe: useMutation({
      mutationFn: (input: UpdateOwnStaffInput) => updateMyStaffProfile(input),
      onSuccess: (profile) => queryClient.setQueryData(myStaffProfileKey, profile),
      onSettled: done,
    }),
  };
}
