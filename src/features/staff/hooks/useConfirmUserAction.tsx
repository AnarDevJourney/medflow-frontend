import { App } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { StaffUser } from "../services/usersService";
import { useUserActions } from "./useUsers";

// Account actions with an explicit confirmation that states the consequence
export function useConfirmUserAction() {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const actions = useUserActions();
  const { mutateAsync: deactivate } = actions.deactivate;
  const { mutateAsync: reactivate } = actions.reactivate;
  const { mutate: resend } = actions.resend;

  // Stable between renders (mutate / mutateAsync are), so a table's
  // memoized columns that call these are not rebuilt on every render
  const confirm = useMemo(() => {
    const name = (u: StaffUser) => `${u.firstName} ${u.lastName}`;
    return {
      deactivate: (user: StaffUser) =>
        modal.confirm({
          title: t("staff.deactivateTitle", { name: name(user) }),
          content: t("staff.deactivateText"),
          okText: t("staff.deactivate"),
          okButtonProps: { danger: true },
          cancelText: t("common.cancel"),
          onOk: () =>
            deactivate(user.id).then(
              () => void message.success(t("staff.deactivated", { name: name(user) })),
            ),
        }),
      reactivate: (user: StaffUser) =>
        modal.confirm({
          title: t("staff.reactivateTitle", { name: name(user) }),
          content: t(
            user.lastLoginAt ? "staff.reactivateText" : "staff.reactivateInvitedText",
          ),
          okText: t("staff.reactivate"),
          cancelText: t("common.cancel"),
          onOk: () =>
            reactivate(user.id).then(
              () => void message.success(t("staff.reactivated", { name: name(user) })),
            ),
        }),
      resend: (user: StaffUser) =>
        resend(user.id, {
          onSuccess: () =>
            void message.success(t("staff.inviteResent", { email: user.email })),
        }),
    };
  }, [t, modal, message, deactivate, reactivate, resend]);

  return { actions, ...confirm };
}
