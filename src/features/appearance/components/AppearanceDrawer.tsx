import {
  BgColorsOutlined,
  CheckOutlined,
  DesktopOutlined,
  MoonOutlined,
  SunOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Alert, Button, ColorPicker, Drawer, Popconfirm, Segmented, Tooltip } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_APPEARANCE,
  DENSITIES,
  MOTIONS,
  PALETTES,
  PRIMARY_PRESETS,
  SIDEBAR_STYLES,
  type Appearance,
  type MotionPreference,
  type PaletteId,
  type UiDensity,
} from "@lib/theme/appearance";
import { buildTheme, primaryFor } from "@lib/theme/buildTheme";
import { contrast } from "@lib/theme/color";
import { THEMES, type Theme } from "@lib/theme/constants";
import { useTheme } from "@lib/theme/useTheme";
import { useAppearanceActions } from "../hooks/useAppearanceActions";
import { AppPreview } from "./AppPreview";
import styles from "./AppearanceDrawer.module.css";

const MODE_ICONS: Record<Theme, ReactNode> = {
  system: <DesktopOutlined />,
  light: <SunOutlined />,
  dark: <MoonOutlined />,
};

// Primary buttons put white text on the accent color: below 4.5:1 it is hard to read
const MIN_CONTRAST = 4.5;

// Every appearance setting with a live preview per option. Changes apply at
// once (and are saved for the signed-in user).
export function AppearanceDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { appearance, resolvedTheme, reducedMotion } = useTheme();
  const { update, reset } = useAppearanceActions();

  const preview = (change: Partial<Appearance>, mode = resolvedTheme) =>
    buildTheme({ ...appearance, ...change }, mode, reducedMotion);
  const isCustomPrimary = !PRIMARY_PRESETS.some(
    (p) => p.light === appearance.primaryColor,
  );
  const lowContrast = contrast(appearance.primaryColor, "#ffffff") < MIN_CONTRAST;
  const isDefault = (Object.keys(DEFAULT_APPEARANCE) as (keyof Appearance)[]).every(
    (key) => appearance[key] === DEFAULT_APPEARANCE[key],
  );

  return (
    <Drawer
      title={
        <span className={styles.title}>
          <BgColorsOutlined /> {t("appearance.title")}
        </span>
      }
      open={open}
      onClose={onClose}
      size={460}
      footer={
        <div className={styles.footer}>
          <Popconfirm
            title={t("appearance.resetConfirmTitle")}
            description={t("appearance.resetConfirmBody")}
            okText={t("appearance.reset")}
            cancelText={t("common.cancel")}
            onConfirm={reset}
            disabled={isDefault}
          >
            <Button icon={<UndoOutlined />} disabled={isDefault}>
              {t("appearance.reset")}
            </Button>
          </Popconfirm>
          <Button type="primary" onClick={onClose}>
            {t("table.done")}
          </Button>
        </div>
      }
    >
      <Section title={t("appearance.mode.title")}>
        <div
          className={styles.grid3}
          role="radiogroup"
          aria-label={t("appearance.mode.title")}
        >
          {THEMES.map((mode) => (
            <OptionCard
              key={mode}
              selected={appearance.mode === mode}
              onSelect={() => update({ mode })}
              label={
                <>
                  {MODE_ICONS[mode]} {t(`common.theme.${mode}`)}
                </>
              }
            >
              {mode === "system" ? (
                <div className={styles.split}>
                  <AppPreview theme={preview({ mode: "light" }, "light")} />
                  <AppPreview
                    theme={preview({ mode: "dark" }, "dark")}
                    className={styles.splitDark}
                  />
                </div>
              ) : (
                <AppPreview theme={preview({ mode }, mode)} />
              )}
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section title={t("appearance.palette.title")} hint={t("appearance.palette.hint")}>
        <div
          className={styles.grid3}
          role="radiogroup"
          aria-label={t("appearance.palette.title")}
        >
          {(Object.keys(PALETTES) as PaletteId[]).map((palette) => (
            <OptionCard
              key={palette}
              selected={appearance.palette === palette}
              onSelect={() => update({ palette })}
              label={t(`appearance.palette.${palette}`)}
            >
              <AppPreview theme={preview({ palette })} />
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section title={t("appearance.primary.title")} hint={t("appearance.primary.hint")}>
        <div
          className={styles.swatches}
          role="radiogroup"
          aria-label={t("appearance.primary.title")}
        >
          {PRIMARY_PRESETS.map((preset) => {
            const selected = appearance.primaryColor === preset.light;
            return (
              <Tooltip key={preset.id} title={t(`appearance.primary.${preset.id}`)}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(`appearance.primary.${preset.id}`)}
                  className={[styles.swatch, selected && styles.swatchSelected]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ background: primaryFor(preset.light, resolvedTheme) }}
                  onClick={() => update({ primaryColor: preset.light })}
                >
                  {selected && <CheckOutlined />}
                </button>
              </Tooltip>
            );
          })}
          <ColorPicker
            value={appearance.primaryColor}
            disabledAlpha
            format="hex"
            onChangeComplete={(color) =>
              update({ primaryColor: color.toHexString().slice(0, 7).toLowerCase() })
            }
          >
            <Button
              size="small"
              className={[styles.custom, isCustomPrimary && styles.customSelected]
                .filter(Boolean)
                .join(" ")}
              icon={
                <span
                  className={styles.customDot}
                  style={{
                    background: isCustomPrimary ? appearance.primaryColor : undefined,
                  }}
                />
              }
            >
              {t("appearance.primary.custom")}
            </Button>
          </ColorPicker>
        </div>
        {lowContrast && (
          <Alert
            className={styles.alert}
            type="warning"
            showIcon
            title={t("appearance.primary.lowContrast")}
          />
        )}
      </Section>

      <Section title={t("appearance.sidebar.title")}>
        <div
          className={styles.grid2}
          role="radiogroup"
          aria-label={t("appearance.sidebar.title")}
        >
          {SIDEBAR_STYLES.map((sidebarStyle) => (
            <OptionCard
              key={sidebarStyle}
              selected={appearance.sidebarStyle === sidebarStyle}
              onSelect={() => update({ sidebarStyle })}
              label={t(`appearance.sidebar.${sidebarStyle}`)}
            >
              <AppPreview theme={preview({ sidebarStyle })} />
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section title={t("appearance.density.title")}>
        <Segmented<UiDensity>
          block
          value={appearance.density}
          onChange={(density) => update({ density })}
          options={DENSITIES.map((density) => ({
            value: density,
            label: t(`appearance.density.${density}`),
          }))}
        />
        <p className={styles.description}>
          {t(`appearance.density.${appearance.density}Desc`)}
        </p>
      </Section>

      <Section title={t("appearance.motion.title")}>
        <Segmented<MotionPreference>
          block
          value={appearance.motion}
          onChange={(motion) => update({ motion })}
          options={MOTIONS.map((motion) => ({
            value: motion,
            label: t(`appearance.motion.${motion}`),
          }))}
        />
        <p className={styles.description}>
          {t(`appearance.motion.${appearance.motion}Desc`)}
        </p>
      </Section>
    </Drawer>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{title}</h3>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
    </section>
  );
}

function OptionCard({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={[styles.card, selected && styles.cardSelected].filter(Boolean).join(" ")}
      onClick={onSelect}
    >
      {children}
      <span className={styles.cardLabel}>
        {label}
        {selected && <CheckOutlined className={styles.check} />}
      </span>
    </button>
  );
}
