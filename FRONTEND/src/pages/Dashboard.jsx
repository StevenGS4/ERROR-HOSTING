import React, { useEffect, useState } from "react";
import { fetchErrors } from "../services/errorService";
import {
  Card,
  CardHeader,
  FlexBox,
  FlexBoxDirection,
  Title,
  Text,
  BusyIndicator,
} from "@ui5/webcomponents-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    unresolved: 0,
    resolved: 0,
    reported: 0,
    ignored: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { ok, rows } = await fetchErrors();
      if (!ok || !Array.isArray(rows)) return;

      const unresolved = rows.filter(
        (e) => e.STATUS === "NEW" || e.STATUS === "IN_PROGRESS"
      ).length;
      const resolved = rows.filter((e) => e.STATUS === "RESOLVED").length;
      const ignored = rows.filter((e) => e.STATUS === "IGNORED").length;
      const reported = rows.length;

      setStats({ unresolved, resolved, reported, ignored });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("❌ Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <Title level="H2">Welcome back, Administrator 👋</Title>
      <Text>
        Here you can monitor and manage your application errors in real time.
      </Text>

      {loading && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <BusyIndicator active size="Large" />
          <p>Loading data...</p>
        </div>
      )}

      {/* 🔹 Tarjetas de estadísticas */}
      <FlexBox
        direction={FlexBoxDirection.Row}
        wrap="Wrap"
        style={{ gap: "1.5rem", marginTop: "2rem" }}
      >
        <Card
          header={<CardHeader titleText="Unresolved Errors" />}
          style={{ width: "250px", textAlign: "center" }}
        >
          <Title level="H2" style={{ color: "#ef4444" }}>
            {stats.unresolved}
          </Title>
        </Card>

        <Card
          header={<CardHeader titleText="Resolved" />}
          style={{ width: "250px", textAlign: "center" }}
        >
          <Title level="H2" style={{ color: "#22c55e" }}>
            {stats.resolved}
          </Title>
        </Card>

        <Card
          header={<CardHeader titleText="Total Reported" />}
          style={{ width: "250px", textAlign: "center" }}
        >
          <Title level="H2" style={{ color: "#2563eb" }}>
            {stats.reported}
          </Title>
        </Card>

        <Card
          header={<CardHeader titleText="Ignored" />}
          style={{ width: "250px", textAlign: "center" }}
        >
          <Title level="H2" style={{ color: "#f59e0b" }}>
            {stats.ignored}
          </Title>
        </Card>
      </FlexBox>

      <Text style={{ marginTop: "2rem", display: "block", color: "#555" }}>
        ⏱️ Last update: {lastUpdate || "Pending..."}
      </Text>
    </div>
  );
};

export default Dashboard;
