import dayjs, { CLINIC_TZ } from "@lib/dayjs";
import type { BloodType } from "@models/enums";

// Same rules as patient-service
export const FIN_PATTERN = /^[A-Z0-9]{7}$/;
export const OLDEST_BIRTH_DATE = "1900-01-01";

export const fullName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`;

// Full years in the clinic's today
export const ageOf = (dateOfBirth: string): number =>
  dayjs().tz(CLINIC_TZ).startOf("day").diff(dayjs(dateOfBirth), "year");

// A_POS → "A+"
export const bloodTypeLabel = (type: BloodType): string =>
  type.replace("_POS", "+").replace("_NEG", "−");
