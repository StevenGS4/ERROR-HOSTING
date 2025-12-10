import respPWA from "./../../middlewares/respPWA-bitacora.js";
import { functionsDic } from "../../helpers/queryDic.js";
import { sendSystemNotification } from "../../helpers/sendSystemNotification.js";
import parseErrorNoti from "../../helpers/parseErrorNoti.js";
import dotenvXConfig from "../../config/dotenvXConfig.js";

const { OK, FAIL, BITACORA } = respPWA;
const VALID_SERVERS = ["mongo", "azure"]; // Lista de servidores permitidos

export const crudErrores = async (params, body) => {
  let bitacora = BITACORA();
  const { queryType, LoggedUser, dbServer } = params;

  // ====================================================================
  // 1️⃣ VALIDACIONES CENTRALIZADAS
  // ====================================================================
  let errorMsg = null;

  // A) Validar Parámetros Requeridos
  const missing = ["LoggedUser", "dbServer", "queryType"].filter(
    (k) => !params[k]
  );

  if (missing.length > 0) {
    errorMsg = `Faltan parámetros: ${missing.join(", ")}`;
  }
  // B) Validar Servidor (Lista blanca)
  else if (!VALID_SERVERS.includes(dbServer)) {
    errorMsg = `Db server no soportado: ${dbServer}`;
  }
  // C) Validar Tipo de Query (Existencia en diccionario)
  else if (!functionsDic[queryType]) {
    errorMsg = `Tipo de consulta no soportado: ${queryType}`;
  }

  // ====================================================================
  // 2️⃣ MANEJO DE ERROR DE VALIDACIÓN
  // ====================================================================
  if (errorMsg) {
    // 2.1 Configurar respuesta HTTP (Bitácora)
    bitacora.success = false;
    bitacora.status = 400; // Bad Request para el cliente HTTP
    bitacora.messageUSR = errorMsg;
    bitacora.messageDEV = errorMsg;
    bitacora.dbServer = dbServer || "desconocido";
    bitacora.loggedUser = LoggedUser || "anónimo";
    bitacora.finalRes = true;

    // 2.2 Estructura solicitada para la notificación
    const newError = {
      message: errorMsg,
      status: 404, // Tu status personalizado solicitado
      source: "BACKEND",
    };

    // 2.3 Notificar a través de parseErrorNoti
    if (dotenvXConfig.SEND_NOTIFICATIONS === "true") {
      try {
        console.log("vacio 2 vato");

        // parseErrorNoti leerá 'message' de newError y detectará el tipo automáticamente
        const parsedError = await parseErrorNoti.parseError(newError);
        await sendSystemNotification(parsedError);
      } catch (notifyErr) {
        console.error("⚠️ Error al notificar validación:", notifyErr);
      }
    }

    return FAIL(bitacora);
  }

  // ====================================================================
  // 3️⃣ EJECUCIÓN DEL SERVICIO
  // ====================================================================
  try {
    // Ejecutar función del diccionario
    bitacora = await functionsDic[queryType](params, bitacora, body);

    return bitacora.success ? OK(bitacora) : FAIL(bitacora);
  } catch (err) {
    console.log("aqui si entre vato");
    console.log(err);
    // ====================================================================
    // 4️⃣ MANEJO DE CRASH / ERROR INTERNO
    // ====================================================================
    console.error("❌ Crash en crudErrores:", err);

    bitacora.success = false;
    bitacora.status = 500;
    bitacora.messageUSR = "Error interno del servidor";
    bitacora.messageDEV = err.message || "Error desconocido";
    bitacora.finalRes = true;
    bitacora.dbServer = dbServer;

    if (dotenvXConfig.SEND_NOTIFICATIONS === "true") {
      try {
        // Para crashes, pasamos el error nativo. parseErrorNoti extraerá el stack.
        console.log("vacio vato");
        console.log(err);
        const parsedError = await parseErrorNoti.parseError(err);
        await sendSystemNotification(parsedError);
      } catch (notifyErr) {
        console.error("⚠️ Error al notificar crash:", notifyErr);
      }
    }

    return FAIL(bitacora);
  }
};
