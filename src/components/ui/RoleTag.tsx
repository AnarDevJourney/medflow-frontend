import {
  CalculatorOutlined,
  CrownOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Role } from "@models/enums";
import styles from "./Tags.module.css";

const ICONS: Record<Role, ReactNode> = {
  ADMIN: <CrownOutlined />,
  DOCTOR: <MedicineBoxOutlined />,
  NURSE: <SolutionOutlined />,
  RECEPTIONIST: <IdcardOutlined />,
  ACCOUNTANT: <CalculatorOutlined />,
};

// Roles carry no status meaning → neutral tag, told apart by icon + text
export function RoleTag({ role }: { role: Role }) {
  const { t } = useTranslation();
  return (
    <span className={styles.tag}>
      <span aria-hidden="true">{ICONS[role]}</span>
      {t(`roles.${role}`)}
    </span>
  );
}
