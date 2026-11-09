import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { App } from "antd";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { refreshStaffSoon } from "./useStaff";
import {
  deactivateUser,
  getUser,
  inviteUser,
  listUsers,
  reactivateUser,
  resendInvite,
  updateUser,
  type InviteUserInput,
  type UpdateUserInput,
  type UsersQuery,
} from "../services/usersService";

export const usersKey = ["users"] as const;

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: [...usersKey, query],
    queryFn: () => listUsers(query),
    placeholderData: keepPreviousData, // no empty flash between pages / filters
  });
}

// One account (users.read) — last sign-in and the facts staff-service lacks
export function useUser(id: string | null, enabled = true) {
  return useQuery({
    queryKey: [...usersKey, "one", id],
    queryFn: () => getUser(id!),
    enabled: Boolean(id) && enabled,
  });
}

// Every user action refreshes the lists; business errors show as a toast
// (forms handle their own field errors)
export function useUserActions() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: usersKey });
    refreshStaffSoon(queryClient);
  };
  const onError = (error: unknown) => void message.error(errorMessage(error));

  return {
    invite: useMutation({
      mutationFn: (input: InviteUserInput) => inviteUser(input),
      onSettled: done,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
        updateUser(id, input),
      onSettled: done,
    }),
    resend: useMutation({ mutationFn: resendInvite, onSettled: done, onError }),
    deactivate: useMutation({ mutationFn: deactivateUser, onSettled: done, onError }),
    reactivate: useMutation({ mutationFn: reactivateUser, onSettled: done, onError }),
  };
}
