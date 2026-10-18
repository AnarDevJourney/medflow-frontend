import dayjs from "dayjs";
import "dayjs/locale/az";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// The API speaks ISO-8601 UTC only; the clinic works in Asia/Baku
// (DOC 12) — every date shown in the UI is converted with these helpers.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const CLINIC_TZ = "Asia/Baku";

export const toClinicTime = (iso: string | Date) => dayjs(iso).tz(CLINIC_TZ);

export const formatDateTime = (iso: string | Date) =>
  toClinicTime(iso).format("DD MMM YYYY, HH:mm");

export const formatDate = (iso: string | Date) => toClinicTime(iso).format("DD MMM YYYY");

export const fromNow = (iso: string | Date) => dayjs(iso).fromNow();

export default dayjs;
