import { App } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import type { Department } from "../services/departmentsService";
import { useDepartmentActions } from "./useDepartments";

// Deactivate / reactivate with a confirmation that states the consequence.
// Stable between renders, so memoized table columns are not rebuilt.
export function useConfirmDepartmentAction() {
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { mutateAsync: update } = useDepartmentActions().update;

  return useMemo(() => {
    const setActive = (department: Department, isActive: boolean, doneKey: string) =>
      update({ id: department.id, input: { isActive } }).then(
        () => void message.success(t(doneKey, { name: department.name })),
        (error: unknown) => void message.error(errorMessage(error)),
      );

    return {
      deactivate: (department: Department) =>
        modal.confirm({
          title: t("departments.deactivateTitle", { name: department.name }),
          content: t("departments.deactivateText"),
          okText: t("departments.deactivate"),
          okButtonProps: { danger: true },
          cancelText: t("common.cancel"),
          onOk: () => setActive(department, false, "departments.deactivated"),
        }),
      reactivate: (department: Department) =>
        modal.confirm({
          title: t("departments.reactivateTitle", { name: department.name }),
          content: t("departments.reactivateText"),
          okText: t("departments.reactivate"),
          cancelText: t("common.cancel"),
          onOk: () => setActive(department, true, "departments.reactivated"),
        }),
    };
  }, [t, modal, message, errorMessage, update]);
}
