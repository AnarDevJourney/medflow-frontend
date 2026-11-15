import { ArrowRightOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import styles from "@components/charts/StatsCard.module.css";
import { useErrorMessage } from "@lib/api/useErrorMessage";
import { useTheme } from "@lib/theme/useTheme";
import dayjs from "@lib/dayjs";
import { PATHS } from "@router/paths";
import { useDoctorAppointmentStats } from "../../hooks/useAppointments";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

// The doctor's own dashboard card (DOC 9.2): today, this week, the next
// days and the last two weeks (GET /appointments/stats/doctor)
export function DoctorStatsCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { reducedMotion } = useTheme();
  const stats = useDoctorAppointmentStats();
  const data = stats.data;

  const header = (
    <header className={styles.header}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon} aria-hidden="true">
          <FieldTimeOutlined />
        </span>
        {t("appointmentStats.mineTitle")}
      </h2>
      <Link to={PATHS.today} className={styles.more}>
        {t("appointmentStats.openToday")} <ArrowRightOutlined aria-hidden="true" />
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
        <Skeleton active paragraph={{ rows: 4 }} />
      </section>
    );
  }

  const chartData = data.daily.map((d) => ({
    label: dayjs(d.date).format("dd"),
    full: dayjs(d.date).format("dd, D MMMM"),
    count: d.count,
  }));

  return (
    <section className={styles.card}>
      {header}
      <div className={`${styles.stats} ${styles.statsTight}`}>
        <StatTile label={t("appointmentStats.today")} value={String(data.today)} />
        <StatTile label={t("appointmentStats.thisWeek")} value={String(data.thisWeek)} />
        <StatTile
          label={t("appointmentStats.next7Days")}
          value={String(data.next7Days)}
        />
        <StatTile
          label={t("appointmentStats.weeklyAverage")}
          value={data.weeklyAverage.toLocaleString()}
        />
        <StatTile
          label={t("appointmentStats.noShowRate")}
          value={data.noShowRate === null ? "—" : `${data.noShowRate}%`}
          sub={t("appointmentStats.last90")}
        />
      </div>
      <section className={styles.chart}>
        <h3 className={styles.subheading}>{t("appointmentStats.last14")}</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              interval={0}
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
                      {t("appointmentStats.visits", { count: point.count })}
                    </strong>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              isAnimationActive={!reducedMotion}
              animationBegin={100}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
        <table className="sr-only">
          <caption>{t("appointmentStats.last14")}</caption>
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
    </section>
  );
}
