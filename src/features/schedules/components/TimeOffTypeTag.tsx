import {
  CoffeeOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  SunOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import tags from "@components/ui/Tags.module.css";
import type { TimeOffType } from "../services/timeOffService";
import styles from "./TimeOff.module.css";

const ICONS: Record<TimeOffType, ReactNode> = {
  VACATION: <SunOutlined />,
  SICK_LEAVE: <MedicineBoxOutlined />,
  DAY_OFF: <CoffeeOutlined />,
  TRAINING: <ReadOutlined />,
};

// Icon + text + color per leave type (never color alone)
export function TimeOffTypeTag({ type }: { type: TimeOffType }) {
  const { t } = useTranslation();
  return (
    <span className={`${tags.tag} ${styles.typeTag}`} data-type={type}>
      <span aria-hidden="true">{ICONS[type]}</span>
      {t(`timeOff.types.${type}`)}
    </span>
  );
}
