import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  ObjectStatus,
  Text,
  FlexBox,
  FlexBoxDirection,
} from "@ui5/webcomponents-react";

import "@ui5/webcomponents-icons/dist/employee.js";

const ErrorCard = ({ error }) => {

  const fecha = error.ERRORDATETIME
    ? new Date(error.ERRORDATETIME).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "Fecha desconocida";

  const statusState =
    error.STATUS === "RESOLVED"
      ? "Success"
      : error.STATUS === "IGNORED"
      ? "Warning"
      : "Error";

  const to = `/errors/${error._id || error.ERRORID || error.rowKey}`;

  // 🔥 NUEVO VALOR: nombre del usuario que generó el error
  const user = error.CREATED_BY_APP || error.USER || error.GENERATEDBY || "Sin usuario";

  // 🎨 Colores del chip de severidad
  const severityColor = {
    CRITICAL: "#b91c1c",
    ERROR: "#9326dcff",
    WARNING: "#f59e0b",
    INFO: "#3b82f6",
  }[error.SEVERITY] || "#6b7280";

  return (
    <div style={{ marginBottom: "1rem", position: "relative" }}>
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        <Card style={{ position: "relative" }}>

          {/* ⭐ ESTATUS EN LA ESQUINA SUPERIOR DERECHA */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "16px",
              zIndex: 10,
            }}
          >
            <ObjectStatus state={statusState} showDefaultIcon>
              {error.STATUS || "NEW"}
            </ObjectStatus>
          </div>

          {/* 🔹 HEADER */}
          <CardHeader
            titleText={`${error.ERRORCODE || "Sin código"} — ${
              error.ERRORSOURCE || "Origen desconocido"
            }`}
            subtitleText={`${user} — ${fecha}`}
            avatar={
              <img
                src={`https://i.pravatar.cc/50?u=${user}`}
                alt={user}
                className="error-avatar"
              />
            }
          />

          {/* 🔹 CUERPO */}
          <FlexBox
            direction={FlexBoxDirection.Column}
            style={{
              padding: "1rem",
              backgroundColor: "#fff",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <Text style={{ lineHeight: "1.4" }}>
              {error.ERRORMESSAGE || "Sin descripción del error"}
            </Text>

            {/* 🔥 CAMPO TIPO Y SEVERIDAD — NUEVO DISEÑO */}
            <FlexBox
              direction={FlexBoxDirection.Row}
              style={{
                marginTop: "0.8rem",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {/* CHIP: Tipo */}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  background: "#e5e7eb",
                  color: "#111",
                  fontWeight: 600,
                }}
              >
                {error.TYPE_ERROR || "No especificado"}
              </span>

              {/* CHIP: Severidad */}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "white",
                  background: severityColor,
                }}
              >
                {error.SEVERITY || "Sin severidad"}
              </span>
            </FlexBox>

            {/* 🔹 RESTO DE CAMPOS */}
            <Text style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "#444" }}>
              <b>Módulo:</b> {error.MODULE || "No definido"}
            </Text>

            <Text style={{ fontSize: "0.85rem", color: "#444" }}>
              <b>Aplicación:</b> {error.APPLICATION || "No especificada"}
            </Text>

          </FlexBox>
        </Card>
      </Link>
    </div>
  );
};

export default ErrorCard;
