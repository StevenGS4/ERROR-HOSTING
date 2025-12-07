import React, { useState } from "react";
import { TabContainer, Tab } from "@ui5/webcomponents-react";

/**
 * 🔹 Tabs SAP Fiori con soporte oficial (icon + additionalText)
 *     Mejorado para soportar nuevos parámetros de Error Manager
 */
const Tabs = ({ tabs = [] }) => {
  const [active, setActive] = useState(0);

  const handleTabSelect = (e) => {
    const index = e.detail.tabIndex;
    setActive(index);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <TabContainer
        collapsed={false}
        fixed={false}
        showOverflow
        onTabSelect={handleTabSelect}
      >
        {tabs.map((tab, i) => {
          // 🔹 Soporte de nuevos posibles parámetros
          const label = tab.label ?? "Sin título";
          const icon = tab.icon ?? "";
          const statusText =
            (typeof tab.status === "string"
              ? tab.status
              : tab.status?.text) || "";

          // 🔹 Badge: puede ser número, estado o texto
          const additionalText =
            tab.badge ??
            statusText ??
            (Array.isArray(tab.users) ? `${tab.users.length}` : "");

          return (
            <Tab
              key={i}
              text={label}
              selected={i === active}
              icon={icon}
              additionalText={additionalText}
            >
              {/* 🔹 Contenido interno estilizado */}
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                {tab.content}
              </div>
            </Tab>
          );
        })}
      </TabContainer>
    </div>
  );
};

export default Tabs;
