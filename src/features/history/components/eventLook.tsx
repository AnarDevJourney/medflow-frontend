import {
  AlertOutlined,
  CalendarOutlined,
  CarryOutOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  EditOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  IdcardOutlined,
  KeyOutlined,
  LoginOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  StopOutlined,
  UndoOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export type EventTone = "primary" | "success" | "warning" | "danger";

// Icon + color per event (history drawer, person timeline); each phase adds its events
const EVENT_LOOK: Record<string, { icon: ReactNode; tone: EventTone }> = {
  "user.invited": { icon: <UserAddOutlined />, tone: "primary" },
  "user.activated": { icon: <CheckCircleOutlined />, tone: "success" },
  "user.updated": { icon: <EditOutlined />, tone: "primary" },
  "user.deactivated": { icon: <StopOutlined />, tone: "danger" },
  "user.reactivated": { icon: <UndoOutlined />, tone: "success" },
  "user.password_changed": { icon: <KeyOutlined />, tone: "warning" },
  "user.session_revoked": { icon: <SafetyOutlined />, tone: "danger" },
  "role_permissions.updated": { icon: <SafetyCertificateOutlined />, tone: "warning" },
  "department.created": { icon: <ClusterOutlined />, tone: "success" },
  "department.updated": { icon: <ClusterOutlined />, tone: "primary" },
  "staff.updated": { icon: <IdcardOutlined />, tone: "primary" },
  "schedule.updated": { icon: <CalendarOutlined />, tone: "primary" },
  "time_off.created": { icon: <CarryOutOutlined />, tone: "warning" },
  "time_off.deleted": { icon: <CarryOutOutlined />, tone: "danger" },
  "patient.registered": { icon: <UserAddOutlined />, tone: "success" },
  "patient.updated": { icon: <UserOutlined />, tone: "primary" },
  "patient.deactivated": { icon: <StopOutlined />, tone: "danger" },
  "patient.reactivated": { icon: <UndoOutlined />, tone: "success" },
  "patient.allergy_added": { icon: <AlertOutlined />, tone: "danger" },
  "patient.allergy_updated": { icon: <AlertOutlined />, tone: "primary" },
  "patient.allergy_removed": { icon: <AlertOutlined />, tone: "warning" },
  "patient.condition_added": { icon: <MedicineBoxOutlined />, tone: "primary" },
  "patient.condition_updated": { icon: <MedicineBoxOutlined />, tone: "primary" },
  "patient.condition_removed": { icon: <MedicineBoxOutlined />, tone: "warning" },
  "appointment.created": { icon: <ScheduleOutlined />, tone: "success" },
  "appointment.updated": { icon: <EditOutlined />, tone: "primary" },
  "appointment.rescheduled": { icon: <FieldTimeOutlined />, tone: "warning" },
  "appointment.checked_in": { icon: <LoginOutlined />, tone: "success" },
  "appointment.cancelled": { icon: <StopOutlined />, tone: "danger" },
  "appointment.no_show": { icon: <UserDeleteOutlined />, tone: "danger" },
};
const DEFAULT_LOOK = { icon: <HistoryOutlined />, tone: "primary" as EventTone };

export const eventLook = (eventType: string) => EVENT_LOOK[eventType] ?? DEFAULT_LOOK;
