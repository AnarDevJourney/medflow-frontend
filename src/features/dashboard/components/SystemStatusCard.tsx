import { Alert, Card, Flex, Skeleton, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useSystemHealth } from "../hooks/useSystemHealth";
import styles from "./SystemStatusCard.module.css";

// Proves the whole chain: browser → Vite proxy → gateway → every service.
// Later the ADMIN dashboard's "service health" widget (DOC 9).
export function SystemStatusCard() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useSystemHealth();

  return (
    <Card title={t("status.title")}>
      {isPending && <Skeleton active />}
      {isError && <Alert type="error" showIcon title={t("status.unreachable")} />}
      {data && (
        <>
          <Alert
            type={data.status === "ok" ? "success" : "warning"}
            showIcon
            title={data.status === "ok" ? t("status.allUp") : t("status.degraded")}
            className={styles.summary}
          />
          {Object.entries(data.checks).map(([name, check]) => (
            <Flex
              key={name}
              justify="space-between"
              align="center"
              className={styles.row}
            >
              <span>{name}</span>
              <Tag color={check.status === "up" ? "green" : "red"}>
                {t(`status.${check.status}`)}
                {check.latencyMs !== undefined && ` · ${check.latencyMs} ms`}
              </Tag>
            </Flex>
          ))}
        </>
      )}
    </Card>
  );
}
