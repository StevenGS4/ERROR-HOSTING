import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  BusyIndicator,
  Text
} from "@ui5/webcomponents-react";

import axios from "axios";
import { sendErrorToServer } from "../services/errorReporter";
import { sendNoti } from "../utils/sendNoti";

import "../styles/test.css";

export default function TestErrorPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ============================================================
  // 1) Cargar usuario logueado DESDE LOCALSTORAGE
  // ============================================================
  async function loadUser() {
    try {
      const saved = localStorage.getItem("loggedUser");

      if (!saved) {
        console.warn("⚠ No hay usuario logueado en localStorage.");
        setLoadingUser(false);
        return;
      }

      const parsed = JSON.parse(saved);

      // ⭐ Validar que exista USERID
      if (!parsed?.USERID) {
        console.warn("⚠ Usuario inválido en localStorage.");
        setLoadingUser(false);
        return;
      }

      // ⭐ ACTUALIZAR datos desde API (por si cambiaron)
      const res = await axios.post(
        "http://localhost:3333/api/users/crud?ProcessType=getById&DBServer=MongoDB&LoggedUser=TEST",
        {
          usuario: { USERID: parsed.USERID }
        }
      );

      // ⭐ Nuevo formato de la API:
      const userFound =
        res.data?.value?.[0]?.data?.[0]?.dataRes ||
        res.data?.value?.[0]?.data?.[0] ||
        null;

      if (!userFound) {
        console.error("❌ No se pudo cargar el usuario desde la API.");
        setLoadingUser(false);
        return;
      }

      // ⭐ Normalizar rol (la API lo devuelve dentro de ROLES[])
      const role = userFound.ROLES?.[0]?.ROLEID || "Sin rol";
      userFound.ROLEID = role;

      setUser(userFound);

      // Actualizar globalmente
      localStorage.setItem("loggedUser", JSON.stringify(userFound));

    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  // ============================================================
  // 2) Generar error con auto-asignación
  // ============================================================
  const generarError = async () => {
    const err = new Error(
      "Error CRÍTICO: No se pudo actualizar el stock del producto durante la operación de sincronización."
    );

    let errorId = null;

    try {
      // 1) Enviar error al ErrorManager (cap + mongo)
      const res = await sendErrorToServer(err, {
        module: "PRODUCTOS",
        component: "ProductSyncService",
        function: "updateStockFromSAP",
        severity: "CRITICAL",
        code: "PROD-STOCK-500",
        source: "front/ProductSync.jsx",
        CREATED_BY_APP: user?.USERID || "UNKNOWN",
        process: "Sincronización de catálogo e inventario",
        environment: "DEV"
      });

      errorId = res?.rows?.[0]?._id;

      // 2) Leer error recién guardado (opcional)
      try {
        const savedError = (
          await axios.get(`http://localhost:3334/odata/v4/api/error/${errorId}`)
        ).data;

        console.log("🔥 savedError:", savedError);
      } catch (e) {
        console.warn("⚠ No pude obtener el error desde ErrorManager:", e);
      }

      // 3) Auto-assignment
      try {
        console.log("⚙ Ejecutando auto-assign...");
        await axios.post("http://localhost:3334/api/error/assign", {
          errorId,
          module: "PRODUCTOS"
        });
        console.log("🟢 Auto-assign ejecutado");
      } catch (e) {
        console.error("❌ Error en auto-assign:", e);
      }

    } catch (e) {
      console.error("ERROR GENERAL EN generarError:", e);
    }

    // 4) Enviar notificación local
    sendNoti(
      err.message,
      errorId,
      "error",
      "PRODUCTOS"
    );
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loadingUser)
    return (
      <div className="test-loading">
        <BusyIndicator active size="Large" />
        <Text style={{ marginTop: "1rem", color: "#fff" }}>
          Cargando usuario…
        </Text>
      </div>
    );

  // ============================================================
  // UI PRINCIPAL
  // ============================================================
  return (
    <div className="test-wrapper">
      <Card className="test-card">

        <CardHeader
          titleText="Simulador de Errores"
          subtitleText="Ventana de prueba para generador de errores"
          avatar={
            <img
              src={`https://i.pravatar.cc/100?u=${user.USERID}`}
              alt={user.USERNAME}
              className="test-avatar"
            />
          }
        />

        <div className="test-user-info">
          <h2>{user.USERNAME}</h2>
          <p className="user-role">{user.ROLEID}</p>

          <div className="user-data-box">
            <p><b>ID:</b> {user.USERID}</p>
            <p><b>Email:</b> {user.EMAIL}</p>
            <p><b>Alias:</b> {user.ALIAS}</p>
            <p><b>Extensión:</b> {user.EXTENSION}</p>
          </div>
        </div>

        <div className="test-action">
          <button className="btn-error" onClick={generarError}>
            🚨 Generar Error
          </button>
        </div>
      </Card>
    </div>
  );
}
