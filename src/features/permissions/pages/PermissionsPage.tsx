import {
  ExclamationCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Skeleton } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router-dom";
import { AppModal } from "@components/modal";
import { EmptyState } from "@components/ui/EmptyState";
import { PageHeader } from "@components/ui/PageHeader";
import { SearchInput } from "@components/ui/SearchInput";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import type { Role } from "@models/enums";
import type { Permission, PermissionGroup } from "@models/permissions";
import { PermissionMatrix, type MatrixSection } from "../components/PermissionMatrix";
import { usePermissionDraft } from "../hooks/usePermissionDraft";
import {
  myPermissionsKey,
  permissionsMatrixKey,
  useCan,
  usePermissionsMatrix,
} from "../hooks/usePermissions";
import {
  updateRolePermissions,
  type MyPermissions,
  type PermissionsMatrix,
} from "../services/permissionsService";
import styles from "./PermissionsPage.module.css";

// Which role may do what (permissions.read to see, permissions.manage to
// change). Ticks are collected locally and saved together; the backend
// stores them, publishes an event and every affected browser updates.
export function PermissionsPage() {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const can = useCan();
  const editable = can("permissions.manage");
  const matrix = usePermissionsMatrix();
  const draft = usePermissionDraft(matrix.data);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<PermissionGroup>>(new Set());
  const dirty = draft.changeCount > 0;

  const save = useMutation({
    mutationFn: () => updateRolePermissions(draft.changedLists()),
    onSuccess: (saved) => {
      queryClient.setQueryData<PermissionsMatrix>(permissionsMatrixKey, (current) =>
        current ? { ...current, roles: { ...current.roles, ...saved } } : current,
      );
      // Own role changed → own menus at once (the socket event follows anyway)
      const own = me && saved[me.role];
      if (own) {
        queryClient.setQueryData<MyPermissions>(myPermissionsKey(me.id), {
          role: me.role,
          permissions: own,
        });
      }
      draft.reset();
      void message.success(t("permissionsPage.saved"));
    },
    onError: (error) => void message.error(errorMessage(error)),
  });

  // Search over the translated texts, so it works in every language
  const sections = useMemo<MatrixSection[]>(() => {
    if (!matrix.data) return [];
    const query = search.toLocaleLowerCase(i18n.language);
    const matches = (code: Permission, group: PermissionGroup) =>
      !query ||
      [
        t(`permissionCatalog.${code}.label`),
        t(`permissionCatalog.${code}.description`),
        t(`permissionGroups.${group}`),
      ].some((text) => text.toLocaleLowerCase(i18n.language).includes(query));

    return matrix.data.groups
      .map((group) => ({
        group,
        codes: matrix.data.permissions
          .filter((p) => p.group === group && matches(p.code, group))
          .map((p) => p.code),
      }))
      .filter((section) => section.codes.length > 0);
  }, [matrix.data, search, t, i18n.language]);

  const catalog = useMemo(
    () => matrix.data?.permissions.map((p) => p.code) ?? [],
    [matrix.data],
  );

  const locked = useCallback(
    (role: Role, code: Permission) => matrix.data?.locked[role]?.includes(code) ?? false,
    [matrix.data],
  );

  const toggleGroup = (group: PermissionGroup) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(group)) next.add(group);
      return next;
    });

  // Leaving with unsaved ticks: in-app navigation asks, a reload / tab close
  // gets the browser's own prompt
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div className={styles.page}>
      <PageHeader
        title={t("permissionsPage.title")}
        subtitle={t("permissionsPage.subtitle")}
      />

      {!editable && (
        <Alert
          className={styles.notice}
          type="info"
          showIcon
          icon={<EyeOutlined />}
          title={t("permissionsPage.readOnlyTitle")}
          description={t("permissionsPage.readOnlyText")}
        />
      )}

      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          placeholder={t("permissionsPage.search")}
          value={search}
          onChange={setSearch}
        />
      </div>

      {matrix.error ? (
        <div className={styles.card}>
          <EmptyState
            icon={<ExclamationCircleOutlined />}
            title={t("permissionsPage.errorTitle")}
            description={errorMessage(matrix.error)}
            action={
              <Button onClick={() => void matrix.refetch()}>
                {t("permissionsPage.retry")}
              </Button>
            }
          />
        </div>
      ) : !matrix.data ? (
        <div className={`${styles.card} ${styles.skeleton}`}>
          <Skeleton active title={false} paragraph={{ rows: 10 }} />
        </div>
      ) : sections.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<SearchOutlined />}
            title={t("permissionsPage.noMatchTitle")}
            description={t("permissionsPage.noMatchText")}
            action={
              <Button onClick={() => setSearch("")}>{t("common.clearFilters")}</Button>
            }
          />
        </div>
      ) : (
        <PermissionMatrix
          sections={sections}
          draft={draft}
          locked={locked}
          editable={editable}
          catalog={catalog}
          // a search shows every match, even in collapsed sections
          collapsed={search ? new Set() : collapsed}
          onToggleGroup={toggleGroup}
        />
      )}

      {editable && (
        <div
          className={`${styles.saveBar} ${dirty ? styles.saveBarVisible : ""}`}
          aria-hidden={!dirty}
        >
          <div className={styles.saveBarInner} role="status">
            <SafetyCertificateOutlined className={styles.saveIcon} aria-hidden="true" />
            <div className={styles.saveText}>
              <span className={styles.saveTitle}>
                {t("permissionsPage.unsaved", { count: draft.changeCount })}
              </span>
              <span className={styles.saveRoles}>
                {t("permissionsPage.unsavedRoles", {
                  roles: draft.changedRoles.map((role) => t(`roles.${role}`)).join(", "),
                })}
              </span>
            </div>
            <div className={styles.saveActions}>
              <Button onClick={draft.reset} disabled={save.isPending || !dirty}>
                {t("permissionsPage.discard")}
              </Button>
              <Button
                type="primary"
                loading={save.isPending}
                disabled={!dirty}
                onClick={() => save.mutate()}
              >
                {t("permissionsPage.save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AppModal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title={t("permissionsPage.leaveTitle")}
        description={t("permissionsPage.leaveText")}
        icon={<ExclamationCircleOutlined />}
        tone="warning"
        size="sm"
        cancelText={t("permissionsPage.stay")}
        primaryAction={{
          label: t("permissionsPage.leave"),
          danger: true,
          onClick: () => blocker.proceed?.(),
        }}
      />
    </div>
  );
}
