import { createError } from "./errorService";

export function sendErrorToServer(err, extra = {}) {

  const payload = {
    // 🔹 Datos obligatorios
    ERRORMESSAGE: err.message,
    ERRORCODE: extra.code || "ERR-UI-GEN",
    ERRORSOURCE: extra.source || extra.component || "Frontend",
    SEVERITY: extra.severity || "HIGH",
    MODULE: extra.module || "UI",
    APPLICATION: "ErrorManager",
    STATUS: "NEW",

    // 🔹 Usuario correcto
    CREATED_BY_APP: extra.CREATED_BY_APP || extra.user || "UNKNOWN",

    // 🔹 Contexto técnico del error
    CONTEXT: {
      component: extra.component || "Unknown",
      function: extra.function || "Unknown",
      errorMessageRaw: err.stack || String(err),
      stackTrace: (err.stack || "").split("\n"),
      httpRequest: extra.http || null,
      timestamp: new Date().toISOString(),

      browser: {
        name: navigator.userAgentData?.brands?.[0]?.brand || "Unknown",
        version: navigator.userAgentData?.brands?.[0]?.version || "Unknown",
        os: navigator.userAgentData?.platform || "Unknown"
      }
    },

    // 🔹 Extras opcionales
    PROCESS: extra.process || null,
    ENVIRONMENT: extra.environment || "DEV",
    DEVICE: extra.device || null
  };

  // 🟣 ➤ AQUI SE AGREGA LA BITÁCORA DEL USUARIO (sessionLog)
  const sessionLog = JSON.parse(localStorage.getItem("sessionLog")) || [];
  payload.USER_SESSION_LOG = sessionLog;

  // 🧹 Limpieza (para que no crezca infinitamente)
  localStorage.removeItem("sessionLog");

  return createError(payload);
}
