import { Col, Row, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { SystemStatusCard } from "../components/SystemStatusCard";

// Role-shaped home page (DOC 9). For now: the system status card.
export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <>
      <Typography.Title level={3}>{t("nav.dashboard")}</Typography.Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <SystemStatusCard />
        </Col>
      </Row>
    </>
  );
}
