import dayjs, { CLINIC_TZ, toClinicTime } from "@lib/dayjs";
import { AppointmentStatus } from "@models/enums";
import type {
  Appointment,
  CalendarData,
  RangeDay,
} from "../../services/appointmentsService";

// One column of the calendar grid: a doctor on a day (day view: one per
// doctor; week view: one per day of the chosen doctor)
export interface CalendarColumn {
  key: string;
  doctorId: string;
  doctorName: string;
  departmentName: string | null;
  departmentId: string | null;
  date: string; // YYYY-MM-DD clinic day
  day: RangeDay | null; // null = no schedule known (e.g. a deactivated doctor)
  appointments: Appointment[];
}

const DAY = "YYYY-MM-DD";

// Minutes since the clinic's midnight of an instant
export const minutesOf = (iso: string) => {
  const t = toClinicTime(iso);
  return t.hour() * 60 + t.minute();
};

// "09:30" → 570
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// 570 → "09:30"
export const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Clinic day + minutes → ISO instant (UTC)
export const instantOf = (date: string, minutes: number) =>
  dayjs.tz(`${date} ${hhmm(minutes)}`, CLINIC_TZ).toISOString();

export const clinicDayOf = (iso: string) => toClinicTime(iso).format(DAY);

export const clinicToday = () => dayjs().tz(CLINIC_TZ).format(DAY);

// Monday … Sunday of the week that holds the day
export function weekOf(date: string): string[] {
  const d = dayjs(date);
  const monday = d.subtract((d.day() + 6) % 7, "day");
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day").format(DAY));
}

// Statuses that hold the time (a free slot must not overlap one of these)
const HOLDS_SLOT = new Set<string>([
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
]);

const byDay = (appointments: Appointment[], doctorId: string, date: string) =>
  appointments.filter((a) => a.doctorId === doctorId && clinicDayOf(a.startsAt) === date);

// Day view: doctors who work that day or already have appointments on it.
// A doctor seen only in appointments (deactivated, moved department) still
// gets a column so nothing booked disappears.
export function dayColumns(data: CalendarData, date: string): CalendarColumn[] {
  const columns: CalendarColumn[] = [];
  for (const doctor of data.doctors) {
    const day = doctor.days.find((d) => d.date === date) ?? null;
    const appointments = byDay(data.appointments, doctor.userId, date);
    if (!day?.working && appointments.length === 0) continue;
    columns.push({
      key: `${doctor.userId}|${date}`,
      doctorId: doctor.userId,
      doctorName: doctor.doctorName,
      departmentName: doctor.departmentName,
      departmentId: doctor.departmentId,
      date,
      day,
      appointments,
    });
  }
  const known = new Set(data.doctors.map((d) => d.userId));
  for (const a of data.appointments) {
    if (known.has(a.doctorId) || clinicDayOf(a.startsAt) !== date) continue;
    known.add(a.doctorId);
    columns.push({
      key: `${a.doctorId}|${date}`,
      doctorId: a.doctorId,
      doctorName: a.doctorName,
      departmentName: a.departmentName,
      departmentId: a.departmentId,
      date,
      day: null,
      appointments: byDay(data.appointments, a.doctorId, date),
    });
  }
  return columns;
}

// Week view: the chosen doctor, Monday to Sunday
export function weekColumns(
  data: CalendarData,
  doctorId: string,
  dates: string[],
): CalendarColumn[] {
  const doctor = data.doctors.find((d) => d.userId === doctorId);
  const fallback = data.appointments.find((a) => a.doctorId === doctorId);
  return dates.map((date) => ({
    key: `${doctorId}|${date}`,
    doctorId,
    doctorName: doctor?.doctorName ?? fallback?.doctorName ?? "",
    departmentName: doctor?.departmentName ?? fallback?.departmentName ?? null,
    departmentId: doctor?.departmentId ?? fallback?.departmentId ?? null,
    date,
    day: doctor?.days.find((d) => d.date === date) ?? null,
    appointments: byDay(data.appointments, doctorId, date),
  }));
}

// Hours shown: from the earliest start to the latest end of the columns
// (working hours and appointments), whole hours; 08:00–18:00 when empty
export function gridRange(columns: CalendarColumn[]): { start: number; end: number } {
  let start = Infinity;
  let end = -Infinity;
  for (const column of columns) {
    if (column.day?.working) {
      start = Math.min(start, toMinutes(column.day.start));
      end = Math.max(end, toMinutes(column.day.end));
    }
    for (const a of column.appointments) {
      start = Math.min(start, minutesOf(a.startsAt));
      end = Math.max(end, minutesOf(a.startsAt) + durationOf(a));
    }
  }
  if (!Number.isFinite(start)) return { start: 8 * 60, end: 18 * 60 };
  return {
    start: Math.floor(start / 60) * 60,
    end: Math.min(24 * 60, Math.ceil(end / 60) * 60),
  };
}

export const durationOf = (a: Appointment) =>
  Math.max(5, Math.round((Date.parse(a.endsAt) - Date.parse(a.startsAt)) / 60_000));

// The bookable slot starts of a working day, in minutes
export function slotStarts(day: RangeDay | null): number[] {
  if (!day?.working) return [];
  const starts: number[] = [];
  const end = toMinutes(day.end);
  for (let m = toMinutes(day.start); m + day.slotMinutes <= end; m += day.slotMinutes) {
    starts.push(m);
  }
  return starts;
}

// Is [start, start + length) free in the column? `ignoreId` = the
// appointment being moved (its own old time does not block it)
export function isFree(
  column: CalendarColumn,
  start: number,
  length: number,
  ignoreId?: string,
): boolean {
  return !column.appointments.some((a) => {
    if (a.id === ignoreId || !HOLDS_SLOT.has(a.status)) return false;
    const from = minutesOf(a.startsAt);
    return from < start + length && from + durationOf(a) > start;
  });
}

// Side-by-side lanes for appointments that overlap (e.g. a new booking on
// top of a no-show): id → lane index and lane count of its group
export function lanesOf(
  appointments: Appointment[],
): Map<string, { lane: number; of: number }> {
  const sorted = [...appointments].sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const result = new Map<string, { lane: number; of: number }>();
  let group: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  const flush = () => {
    for (const item of group)
      result.set(item.id, { lane: item.lane, of: laneEnds.length });
    group = [];
    laneEnds = [];
  };
  for (const a of sorted) {
    const from = minutesOf(a.startsAt);
    const to = from + durationOf(a);
    if (from >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    let lane = laneEnds.findIndex((end) => end <= from);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(to);
    } else laneEnds[lane] = to;
    group.push({ id: a.id, lane });
    groupEnd = Math.max(groupEnd, to);
  }
  flush();
  return result;
}
