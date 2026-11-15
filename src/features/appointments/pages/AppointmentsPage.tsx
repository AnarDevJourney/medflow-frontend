import {
  AppstoreOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  UnorderedListOutlined,
  EditOutlined,
  FieldTimeOutlined,
  LoginOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App, Button, Flex, Segmented, Select } from "antd";
import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowMenuItem,
  type DataTableSort,
} from "@components/data-table";
import { ClearFiltersButton } from "@components/ui/ClearFiltersButton";
import { DateRangeFilter } from "@components/ui/DateRangeFilter";
import { PageHeader } from "@components/ui/PageHeader";
import { SearchInput } from "@components/ui/SearchInput";
import { StatusBadge } from "@components/ui/StatusBadge";
import { UserAvatar } from "@components/ui/UserAvatar";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { DepartmentSelect } from "@features/departments/components/DepartmentSelect";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { useDoctors, useMyStaffProfile } from "@features/staff/hooks/useStaff";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs, { CLINIC_TZ, formatDate } from "@lib/dayjs";
import { AppointmentStatus, Role } from "@models/enums";
import { STATUS_COLOR } from "@utils/statusColors";
import type { DayRange } from "@utils/dayRange";
import { AppointmentDrawer } from "../components/AppointmentDrawer";
import { CalendarPanel } from "../components/calendar/CalendarPanel";
import {
  BookAppointmentModal,
  type PresetSlot,
} from "../components/BookAppointmentModal";
import { CancelAppointmentModal } from "../components/CancelAppointmentModal";
import { EditAppointmentModal } from "../components/EditAppointmentModal";
import { RescheduleModal } from "../components/RescheduleModal";
import { useAppointmentActions, useAppointments } from "../hooks/useAppointments";
import { useAppointmentRules } from "../hooks/useAppointmentRules";
import type { Appointment } from "../services/appointmentsService";
import { dayLabel, timeRange } from "../utils/appointment";
import styles from "./AppointmentsPage.module.css";

// DataTable column key → API sort field
const SORT_FIELDS: Record<string, string> = {
  startsAt: "startsAt",
  createdAt: "createdAt",
};

const parseSort = (value: string | null): DataTableSort | null => {
  const [key, order] = value?.split(":") ?? [];
  return key && key in SORT_FIELDS && (order === "asc" || order === "desc")
    ? { key, order }
    : null;
};

const DAY = "YYYY-MM-DD";
const clinicToday = () => dayjs().tz(CLINIC_TZ).format(DAY);

const VIEWS = ["list", "day", "week"] as const;
type AppointmentsView = (typeof VIEWS)[number];
const VIEW_ICONS: Record<AppointmentsView, React.ReactNode> = {
  list: <UnorderedListOutlined />,
  day: <AppstoreOutlined />,
  week: <ScheduleOutlined />,
};
const VIEW_KEY = "medflow-appointments-view";

// Day view by default; storage can be blocked (private mode) — then default
function readStoredView(): AppointmentsView {
  try {
    const stored = localStorage.getItem(VIEW_KEY) as AppointmentsView | null;
    return stored && VIEWS.includes(stored) ? stored : "day";
  } catch {
    return "day";
  }
}

function storeView(view: AppointmentsView) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // not remembered — the URL still holds it
  }
}

// Appointments list (DOC 9.1; the calendar view comes in 7.3). From today
// on by default; filters, sort and page live in the URL. A doctor sees
// their own appointments unless they switch to everyone's.
export function AppointmentsPage() {
  const { t } = useTranslation();
  const can = useCan();
  const canBook = can("appointments.book") && can("appointments.availability");
  const me = useCurrentUser().data;
  const isDoctor = me?.role === Role.DOCTOR;
  const isNurse = me?.role === Role.NURSE;
  // A nurse's "today" starts with her own department
  const myProfile = useMyStaffProfile(isNurse);
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const departmentId = params.get("department") ?? undefined;
  const doctorId = params.get("doctor") ?? undefined;
  const statusParam = params.get("status") as AppointmentStatus | null;
  const status =
    statusParam && statusParam in AppointmentStatus ? statusParam : undefined;
  const everyone = params.get("scope") === "all";
  // Period: from today on unless the user picked days or cleared the range
  const anyPeriod = params.get("period") === "all";
  const fromParam = params.get("from");
  const to = params.get("to") ?? undefined;
  const from = fromParam ?? (anyPeriod || to ? undefined : clinicToday());
  const sort = parseSort(params.get("sort"));
  const page = Number(params.get("page")) || 1;
  const pageSize = Number(params.get("size")) || 20;
  // Writes the given keys (undefined removes one); filters go back to page 1
  const update = (patch: Record<string, string | number | undefined>, keepPage = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === "") next.delete(key);
          else next.set(key, String(value));
        }
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace: true },
    );

  const [bookOpen, setBookOpen] = useState(false);
  const [bookSlot, setBookSlot] = useState<PresetSlot | null>(null);
  // List / day / week: the URL wins, else the last choice on this browser
  const viewParam = params.get("view") as AppointmentsView | null;
  const view: AppointmentsView =
    viewParam && VIEWS.includes(viewParam) ? viewParam : readStoredView();
  const changeView = (next: AppointmentsView) => {
    storeView(next);
    update({ view: next }, true);
  };
  const calendarDate = params.get("date") ?? clinicToday();
  // A doctor's week starts with their own
  const calendarDoctor = doctorId ?? (view === "week" && isDoctor ? me?.id : undefined);
  const [moveRow, setMoveRow] = useState<Appointment | null>(null);
  const [editRow, setEditRow] = useState<Appointment | null>(null);
  const [cancelRow, setCancelRow] = useState<Appointment | null>(null);
  const { message } = App.useApp();
  const errorMessage = useErrorMessage();
  const { checkIn } = useAppointmentActions();
  const rulesOf = useAppointmentRules();
  const onCheckIn = (a: Appointment) =>
    checkIn.mutate(a.id, {
      onSuccess: (done) =>
        void message.success(t("appointments.checkIn.done", { name: done.patientName })),
      onError: (error) => void message.error(errorMessage(error)),
    });
  const commands = {
    onCheckIn,
    onReschedule: setMoveRow,
    onEdit: setEditRow,
    onCancel: setCancelRow,
    checkingIn: checkIn.isPending,
  };
  const rowActions = (a: Appointment): DataTableRowMenuItem[] => {
    const rules = rulesOf(a);
    const main: DataTableRowMenuItem[] = [];
    if (rules.checkIn) {
      main.push({
        key: "checkIn",
        icon: <LoginOutlined />,
        label: t("appointments.actions.checkIn"),
        onClick: () => onCheckIn(a),
      });
    }
    if (rules.reschedule) {
      main.push({
        key: "reschedule",
        icon: <FieldTimeOutlined />,
        label: t("appointments.actions.reschedule"),
        onClick: () => setMoveRow(a),
      });
    }
    if (rules.edit) {
      main.push({
        key: "edit",
        icon: <EditOutlined />,
        label: t("appointments.actions.edit"),
        onClick: () => setEditRow(a),
      });
    }
    if (!rules.cancel) return main;
    const cancel: DataTableRowMenuItem = {
      key: "cancel",
      icon: <StopOutlined />,
      label: t("appointments.actions.cancel"),
      danger: true,
      onClick: () => setCancelRow(a),
    };
    return main.length ? [...main, "divider", cancel] : [cancel];
  };
  const today = clinicToday();
  const showingToday = from === today && to === today;
  const showToday = () =>
    update({
      from: today,
      to: today,
      period: undefined,
      department:
        isNurse && !departmentId
          ? (myProfile.data?.department?.id ?? undefined)
          : departmentId,
    });
  const [openRow, setOpenRow] = useState<Appointment | null>(null);
  const doctors = useDoctors(departmentId);

  const appointments = useAppointments({
    page,
    limit: pageSize,
    search: search || undefined,
    from,
    to,
    departmentId,
    doctorId,
    status,
    allDoctors: isDoctor && everyone ? true : undefined,
    sort: sort ? `${SORT_FIELDS[sort.key]}:${sort.order}` : undefined,
  });
  // The fresh row when it is on this page (the list refetches after every
  // change), else the one that was opened (e.g. just booked, filtered out)
  const opened = openRow
    ? (appointments.data?.items.find((a) => a.id === openRow.id) ?? openRow)
    : null;

  const filtersActive = Boolean(
    search ||
    departmentId ||
    doctorId ||
    status ||
    fromParam ||
    to ||
    anyPeriod ||
    everyone,
  );
  const resetFilters = () =>
    update({
      q: undefined,
      department: undefined,
      doctor: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
      period: undefined,
      scope: undefined,
    });
  const range: DayRange =
    from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;
  const onRange = (next: DayRange) => {
    const [start, end] = next ?? [null, null];
    const day = (d: Dayjs | null) => (d ? d.format(DAY) : undefined);
    if (!start && !end) update({ from: undefined, to: undefined, period: "all" });
    else update({ from: day(start), to: day(end), period: undefined });
  };

  const columns = useMemo<DataTableColumn<Appointment>[]>(
    () => [
      {
        key: "startsAt",
        title: t("appointments.columns.time"),
        width: 200,
        hideable: false,
        sortable: true,
        render: (_, a) => (
          <span className={styles.time}>
            <span className={styles.timeRange}>{timeRange(a.startsAt, a.endsAt)}</span>
            <span className={styles.sub}>{dayLabel(a.startsAt)}</span>
          </span>
        ),
      },
      {
        key: "patient",
        title: t("appointments.fields.patient"),
        width: 260,
        render: (_, a) => {
          const [firstName = "", ...rest] = a.patientName.split(" ");
          return (
            <span className={styles.person}>
              <UserAvatar firstName={firstName} lastName={rest.join(" ")} size={28} />
              <span className={styles.personText}>
                <span className={styles.personName}>{a.patientName}</span>
                <span className={styles.mrn}>{a.patientMrn}</span>
              </span>
            </span>
          );
        },
      },
      {
        key: "doctor",
        title: t("appointments.fields.doctor"),
        width: 220,
        render: (_, a) => (
          <span className={styles.personText}>
            <span className={styles.personName}>{a.doctorName}</span>
            <span className={styles.sub}>{a.departmentName}</span>
          </span>
        ),
      },
      {
        key: "type",
        title: t("appointments.fields.type"),
        dataIndex: "type",
        width: 140,
        render: (value) => t(`appointments.types.${String(value)}`),
      },
      {
        key: "status",
        title: t("appointments.columns.status"),
        dataIndex: "status",
        width: 140,
        render: (value) => <StatusBadge status={value as AppointmentStatus} />,
      },
      {
        key: "reason",
        title: t("appointments.fields.reason"),
        dataIndex: "reason",
        width: 240,
        defaultHidden: true,
        render: (value) =>
          value ? (
            <span className={styles.ellipsis}>{String(value)}</span>
          ) : (
            <span className={styles.muted}>—</span>
          ),
      },
      {
        key: "phone",
        title: t("patients.fields.phone"),
        dataIndex: "patientPhone",
        width: 170,
        defaultHidden: true,
        render: (value) => <span className={styles.tabular}>{String(value)}</span>,
      },
      {
        key: "createdAt",
        title: t("appointments.fields.booked"),
        dataIndex: "createdAt",
        width: 140,
        numeric: true,
        align: "left",
        sortable: true,
        render: (value) => formatDate(String(value)),
      },
    ],
    [t],
  );

  const bookButton = canBook && (
    <Button
      type="primary"
      icon={<CalendarOutlined />}
      onClick={() => {
        setBookSlot(null);
        setBookOpen(true);
      }}
    >
      {t("appointments.bookButton")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("appointments.title")}
        subtitle={t("appointments.subtitle")}
        actions={
          <>
            <Segmented<AppointmentsView>
              value={view}
              onChange={changeView}
              options={VIEWS.map((v) => ({
                value: v,
                label: t(`appointments.views.${v}`),
                icon: VIEW_ICONS[v],
              }))}
              aria-label={t("appointments.views.label")}
            />
            {bookButton}
          </>
        }
      />
      {view !== "list" ? (
        <CalendarPanel
          state={{
            view,
            date: calendarDate,
            departmentId,
            doctorId: calendarDoctor,
            showCancelled: params.get("cancelled") === "1",
          }}
          onChange={(patch) =>
            update(
              {
                ...("date" in patch
                  ? { date: patch.date === clinicToday() ? undefined : patch.date }
                  : {}),
                ...("departmentId" in patch ? { department: patch.departmentId } : {}),
                ...("doctorId" in patch ? { doctor: patch.doctorId } : {}),
                ...("showCancelled" in patch
                  ? { cancelled: patch.showCancelled ? "1" : undefined }
                  : {}),
              },
              true,
            )
          }
          onOpen={setOpenRow}
          onBookSlot={
            canBook
              ? (slot) => {
                  setBookSlot(slot);
                  setBookOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <DataTable<Appointment>
          tableKey="appointments"
          columns={columns}
          data={appointments.data?.items}
          rowKey="id"
          loading={appointments.isFetching}
          error={appointments.error}
          onRetry={() => void appointments.refetch()}
          sort={sort}
          onSortChange={(value) =>
            update({ sort: value ? `${value.key}:${value.order}` : undefined })
          }
          pagination={{
            page,
            pageSize,
            total: appointments.data?.meta.total ?? 0,
            onChange: (nextPage, nextSize) =>
              update(
                {
                  page: nextSize === pageSize && nextPage > 1 ? nextPage : undefined,
                  size: nextSize === 20 ? undefined : nextSize,
                },
                true,
              ),
          }}
          onRowClick={setOpenRow}
          onViewDetails={setOpenRow}
          rowLabel={(a) => `${a.patientName} ${timeRange(a.startsAt, a.endsAt)}`}
          rowActions={rowActions}
          rowAccent={(a) => STATUS_COLOR[a.status]}
          empty={
            filtersActive
              ? {
                  title: t("appointments.noMatchTitle"),
                  description: t("appointments.noMatchText"),
                  action: (
                    <Flex gap="small" wrap justify="center">
                      <Button onClick={resetFilters}>{t("common.clearFilters")}</Button>
                      {bookButton}
                    </Flex>
                  ),
                }
              : {
                  title: t("appointments.emptyTitle"),
                  description: t(
                    canBook ? "appointments.emptyText" : "appointments.emptyReadText",
                  ),
                  action: bookButton,
                }
          }
          toolbar={
            <>
              <SearchInput
                placeholder={t("appointments.search")}
                value={search}
                onChange={(value) => update({ q: value })}
                className={styles.search}
              />
              {isDoctor && (
                <Segmented
                  value={everyone ? "all" : "mine"}
                  onChange={(value) =>
                    update({ scope: value === "all" ? "all" : undefined })
                  }
                  options={[
                    { value: "mine", label: t("appointments.scope.mine") },
                    { value: "all", label: t("appointments.scope.all") },
                  ]}
                />
              )}
              <Button
                type={showingToday ? "primary" : "default"}
                ghost={showingToday}
                onClick={showToday}
                aria-pressed={showingToday}
              >
                {t("appointments.today")}
              </Button>
              <DateRangeFilter value={range} onChange={onRange} />
              <DepartmentSelect
                allowClear
                placeholder={t("appointments.allDepartments")}
                value={departmentId}
                onChange={(value) =>
                  update({ department: value, doctor: value ? undefined : doctorId })
                }
                className={styles.filter}
                aria-label={t("appointments.fields.department")}
              />
              <Select<string>
                allowClear
                showSearch={{ optionFilterProp: "label" }}
                placeholder={t("appointments.allDoctors")}
                value={doctorId}
                onChange={(value) => update({ doctor: value })}
                loading={doctors.isLoading}
                options={(doctors.data ?? []).map((d) => ({
                  value: d.userId,
                  label: `${d.firstName} ${d.lastName}`,
                }))}
                className={styles.filter}
                aria-label={t("appointments.fields.doctor")}
              />
              <Select<AppointmentStatus>
                allowClear
                placeholder={t("appointments.allStatuses")}
                value={status}
                onChange={(value) => update({ status: value })}
                options={Object.values(AppointmentStatus).map((s) => ({
                  value: s,
                  label: t(`appointmentStatus.${s}`),
                }))}
                className={styles.filter}
                aria-label={t("appointments.columns.status")}
              />
              <ClearFiltersButton active={filtersActive} onClear={resetFilters} />
            </>
          }
        />
      )}
      <AppointmentDrawer
        appointment={opened}
        onClose={() => setOpenRow(null)}
        commands={commands}
      />
      <RescheduleModal appointment={moveRow} onClose={() => setMoveRow(null)} />
      <EditAppointmentModal appointment={editRow} onClose={() => setEditRow(null)} />
      <CancelAppointmentModal
        appointment={cancelRow}
        onClose={() => setCancelRow(null)}
      />
      <BookAppointmentModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        slot={bookSlot}
        onBooked={setOpenRow}
      />
    </>
  );
}
