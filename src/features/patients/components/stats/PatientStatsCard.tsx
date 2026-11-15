import {
  ArrowRightOutlined,
  ManOutlined,
  TeamOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import type { ReactNode } from "react";
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
import { EmptyState } from "@components/ui/EmptyState";
import { useTheme } from "@lib/theme/useTheme";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import dayjs from "@lib/dayjs";
import { PATHS } from "@router/paths";
import { usePatientStats } from "../../hooks/usePatients";
import styles from "./PatientStatsCard.module.css";

const monthLabel = (month: string, format: string) => dayjs(`${month}-01`).format(format);

// One headline number
function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: ReactNode;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value.toLocaleString()}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

// Labeled horizontal bars: one hue, the value and share printed beside each
// bar, so nothing is read from color alone
function ShareBars({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: ReactNode; count: number }[];
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <section className={styles.shares}>
      <h3 className={styles.subheading}>{title}</h3>
      <ul className={styles.shareList}>
        {rows.map((row, index) => {
          const share = total ? Math.round((row.count / total) * 100) : 0;
          return (
            <li key={row.key} className={styles.shareRow}>
              <span className={styles.shareLabel}>{row.label}</span>
              <span className={styles.shareTrack} aria-hidden="true">
                <span
                  className={styles.shareFill}
                  style={{
                    width: `${(row.count / max) * 100}%`,
                    animationDelay: `${100 + index * 60}ms`,
                  }}
                />
              </span>
              <span className={styles.shareValue}>
                {row.count.toLocaleString()}
                <span className={styles.shareSub}> · {share}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Admin dashboard (DOC 9.2): totals, new patients per month (last 12) and
// the sex / age make-up of active patients (GET /patients/stats)
export function PatientStatsCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const stats = usePatientStats();
  const data = stats.data;
  const { reducedMotion } = useTheme();

  const header = (
    <header className={styles.header}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon} aria-hidden="true">
          <TeamOutlined />
        </span>
        {t("patientStats.title")}
      </h2>
      <Link to={PATHS.patients} className={styles.more}>
        {t("patientStats.openList")} <ArrowRightOutlined aria-hidden="true" />
      </Link>
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

  const { totals } = data;
  if (totals.active + totals.inactive === 0) {
    return (
      <section className={styles.card}>
        {header}
        <EmptyState
          compact
          icon={<TeamOutlined />}
          title={t("patientStats.emptyTitle")}
          description={t("patientStats.emptyText")}
        />
      </section>
    );
  }

  const change = totals.newThisMonth - totals.newLastMonth;
  const chartData = data.monthly.map((m) => ({
    label: monthLabel(m.month, "MMM"),
    full: monthLabel(m.month, "MMMM YYYY"),
    count: m.count,
  }));

  return (
    <section className={styles.card}>
      {header}
      <div className={styles.stats}>
        <StatTile label={t("patientStats.active")} value={totals.active} />
        <StatTile
          label={t("patientStats.newThisMonth")}
          value={totals.newThisMonth}
          sub={
            change === 0
              ? t("patientStats.sameAsLastMonth")
              : t(
                  change > 0 ? "patientStats.moreThanLast" : "patientStats.lessThanLast",
                  {
                    count: Math.abs(change),
                  },
                )
          }
        />
        <StatTile label={t("patientStats.newLastMonth")} value={totals.newLastMonth} />
        <StatTile label={t("patientStats.inactive")} value={totals.inactive} />
      </div>

      <div className={styles.body}>
        <section className={styles.chart}>
          <h3 className={styles.subheading}>{t("patientStats.perMonth")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                interval={0}
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
                    { full: string; count: number } | undefined;
                  if (!active || !point) return null;
                  return (
                    <div className={styles.tooltip}>
                      <span className={styles.tooltipLabel}>{point.full}</span>
                      <strong>
                        {t("patientStats.newCount", { count: point.count })}
                      </strong>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                // Bars grow in on first paint (off when motion is reduced)
                isAnimationActive={!reducedMotion}
                animationBegin={100}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
          {/* The same numbers as a table for screen readers */}
          <table className="sr-only">
            <caption>{t("patientStats.perMonth")}</caption>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.full}>
                  <th scope="row">{row.full}</th>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className={styles.side}>
          <ShareBars
            title={t("patientStats.bySex")}
            rows={[
              {
                key: "FEMALE",
                label: (
                  <>
                    <WomanOutlined aria-hidden="true" /> {t("patients.gender.FEMALE")}
                  </>
                ),
                count: data.gender.FEMALE,
              },
              {
                key: "MALE",
                label: (
                  <>
                    <ManOutlined aria-hidden="true" /> {t("patients.gender.MALE")}
                  </>
                ),
                count: data.gender.MALE,
              },
            ]}
          />
          <ShareBars
            title={t("patientStats.byAge")}
            rows={data.ageGroups.map((g) => ({
              key: g.group,
              label: t(`patientStats.ageGroups.${g.group}`),
              count: g.count,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
