import { useCallback } from "react";
import { useCan } from "@features/permissions/hooks/usePermissions";
import { AppointmentStatus } from "@models/enums";
import type { Appointment } from "../services/appointmentsService";
import { isClinicToday } from "../utils/appointment";

// What the signed-in user may do with an appointment now: the backend's
// permission + status rules, so buttons only show when they would work
export function useAppointmentRules() {
  const can = useCan();
  const canBook = can("appointments.book");
  const canPickSlots = can("appointments.availability");
  const canCheckIn = can("appointments.check_in");

  return useCallback(
    (a: Appointment) => {
      const scheduled = a.status === AppointmentStatus.SCHEDULED;
      const open = scheduled || a.status === AppointmentStatus.CHECKED_IN;
      return {
        checkIn: canCheckIn && scheduled && isClinicToday(a.startsAt),
        reschedule: canBook && canPickSlots && scheduled,
        edit: canBook && open,
        cancel: canBook && open,
      };
    },
    [canBook, canPickSlots, canCheckIn],
  );
}
