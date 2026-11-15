import { ArrowRightOutlined, CalendarOutlined } from "@ant-design/icons";
import { Alert, Button, Segmented, Skeleton } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ShareBars } from "@components/charts/ShareBars";
import styles from "@components/charts/StatsCard.module.css";
import { EmptyState } from "@components/ui/EmptyState";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useTheme } from "@lib/theme/useTheme";
import dayjs, { CLINIC_TZ } from "@lib/dayjs";
import { PATHS } from "@router/paths";
import { useAppointmentOverview } from "../../hooks/useAppointments";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// Stacked in this order (bottom → top) — the validated adjacency
const SERIES = [
  { key: "completed", color: "var(--chart-completed)" },
  { key: "scheduled", color: "var(--chart-scheduled)" },
  { key: "noShow", color: "var(--chart-no-show)" },
  { key: "cancelled", color: "var(--chart-cancelled)" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

// Admin dashboard (DOC 9.2): how busy the clinic was / will be in a range —
// totals, no-show rate, visits per day by outcome, departments and the
// busiest doctors (GET /appointments/stats/overview)
export function AppointmentStatsCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { reducedMotion } = useTheme();
  const [range, setRange] = useState<Range>(30);
  const query = useMemo(() => {
    const to = dayjs().tz(CLINIC_TZ);
    return {
      from: to.subtract(range - 1, "day").format("YYYY-MM-DD"),
      to: to.format("YYYY-MM-DD"),
    };
  }, [range]);
  const stats = useAppointmentOverview(query);
  const data = stats.data;

  const header = (
    <header className={styles.header}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon} aria-hidden="true">
          <CalendarOutlined />
        </span>
        {t("appointmentStats.title")}
      </h2>
      <span className={styles.headerEnd}>
        <Segmented<Range>
          size="small"
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({
            value: r,
            label: t("appointmentStats.lastDays", { count: r }),
          }))}
          aria-label={t("appointmentStats.range")}
        />
        <Link to={PATHS.appointments} className={styles.more}>
          {t("appointmentStats.open")} <ArrowRightOutlined aria-hidden="true" />
        </Link>
      </span>
    </header>
  );

  if (stats.error) {
    return (
      <section className={styles.card}>
        {header}
        <Alert
          type="error"
          showIcon
          title={errorMessage(stats.error)}
          action={
            <Button size="small" onClick={() => void stats.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      </section>
    );
  }
  if (!data) {
    return (
      <section className={styles.card}>
        {header}
        <Skeleton active paragraph={{ rows: 6 }} />
      </section>
    );
  }
  if (data.total === 0) {
    return (
      <section className={styles.card}>
        {header}
        <EmptyState
          compact
          icon={<CalendarOutlined />}
          title={t("appointmentStats.emptyTitle")}
          description={t("appointmentStats.emptyText")}
        />
      </section>
    );
  }

  const s = data.byStatus;
  const held = data.total - s.CANCELLED; // visits that kept their slot
  const chartData = data.daily.map((d) => ({
    label: dayjs(d.date).format(range > 30 ? "D MMM" : "D"),
    full: dayjs(d.date).format("dd, D MMMM YYYY"),
    completed: d.COMPLETED,
    scheduled: d.SCHEDULED + d.CHECKED_IN + d.IN_PROGRESS,
    noShow: d.NO_SHOW,
    cancelled: d.CANCELLED,
  }));
  const label = (key: SeriesKey) => t(`appointmentStats.series.${key}`);

  return (
    <section className={styles.card}>
      {header}
      <div className={styles.stats}>
        <StatTile label={t("appointmentStats.total")} value={held.toLocaleString()} />
        <StatTile
          label={t("appointmentStats.completed")}
          value={s.COMPLETED.toLocaleString()}
        />
        <StatTile
          label={t("appointmentStats.noShowRate")}
          value={data.noShowRate === null ? "—" : `${data.noShowRate}%`}
          sub={t("appointmentStats.noShowCount", { count: s.NO_SHOW })}
        />
        <StatTile
          label={t("appointmentStats.cancelled")}
          value={s.CANCELLED.toLocaleString()}
        />
      </div>

      <div className={styles.body}>
        <section className={styles.chart}>
          <h3 className={styles.subheading}>{t("appointmentStats.perDay")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
              barCategoryGap={range > 30 ? 1 : "20%"}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                width={44}
              />
              <Tooltip
                cursor={{ fill: "var(--color-hover)" }}
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as
                    (Record<SeriesKey, number> & { full: string }) | undefined;
                  if (!active || !point) return null;
                  return (
                    <div className={styles.tooltip}>
                      <span className={styles.tooltipLabel}>{point.full}</span>
                      {[...SERIES].reverse().map((series) => (
                        <span key={series.key} className={styles.tooltipRow}>
                          <span
                            className={styles.legendSwatch}
                            style={{ "--swatch": series.color } as React.CSSProperties}
                          />
                          <span>{label(series.key)}</span>
                          <span className={styles.tooltipValue}>{point[series.key]}</span>
                        </span>
                      ))}
                    </div>
                  );
                }}
              />
              {SERIES.map((series, index) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  stackId="day"
                  fill={series.color}
                  // a 2px card-colored gap between stacked segments
                  stroke="var(--color-card)"
                  strokeWidth={1}
                  maxBarSize={24}
                  radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={!reducedMotion}
                  animationBegin={100 + index * 80}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {SERIES.map((series) => (
              <span key={series.key} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ "--swatch": series.color } as React.CSSProperties}
                  aria-hidden="true"
                />
                {label(series.key)}
              </span>
            ))}
          </div>
          {/* The same numbers as a table for screen readers */}
          <table className="sr-only">
            <caption>{t("appointmentStats.perDay")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("appointments.fields.date")}</th>
                {SERIES.map((series) => (
                  <th key={series.key} scope="col">
                    {label(series.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.full}>
                  <th scope="row">{row.full}</th>
                  {SERIES.map((series) => (
                    <td key={series.key}>{row[series.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className={styles.side}>
          <ShareBars
            title={t("appointmentStats.byDepartment")}
            rows={data.departments.slice(0, 6).map((d) => ({
              key: d.departmentId,
              label: d.name,
              count: d.count,
            }))}
          />
          <ShareBars
            title={t("appointmentStats.topDoctors")}
            showShare={false}
            rows={data.doctors.map((d) => ({
              key: d.doctorId,
              label: d.name,
              count: d.count,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
