import mongoService from "../api/services/zterrorlog-service.js";
import dotenvXConfig from "../config/dotenvXConfig.js";
import azureService from "./../api/services/azure-zterrorlog-service.js";
import parseErrorNoti from "./../helpers/parseErrorNoti.js";
import { sendSystemNotification } from "./sendSystemNotification.js";

// ====================================================================
// 🛠️ HELPER: SELECTOR DE SERVICIO
// ====================================================================
/**
 * Decide qué servicio usar y normaliza la ejecución del método
 */
const runService = async (dbServer, action, payload = null) => {
  const isAzure = dbServer.toLowerCase() === "azure";
  // console.log(dbServer);

  switch (action) {
    case "getAll":
      return isAzure
        ? await azureService.getAllErrors()
        : await mongoService.GetAllErrors();

    case "getOne":
      return isAzure
        ? await azureService.getError(payload)
        : await mongoService.GetOneError(payload);

    case "add":
      return isAzure
        ? await azureService.addError(payload)
        : await mongoService.InsertOneError(payload);

    case "update":
      return isAzure
        ? await azureService.updateError(payload)
        : await mongoService.UpdateOneError(payload);

    case "delete":
      return isAzure
        ? await azureService.deleteError(payload)
        : await mongoService.DeleteOneError(payload);
    // case "ai-suggestion":
    //   return isAzure
    //   ? await azureService.GetAi(payload)
    //   : await mongoService.GetAi(payload)
    default:
      throw new Error(`Acción ${action} no soportada`);
  }
};

// ====================================================================
// 🔔 HELPER: NOTIFICACIÓN SISTEMA
// ====================================================================

// ====================================================================
// 🟢 FUNCIONES DEL DICCIONARIO
// ====================================================================

// === GET ALL ===
const getAllFunction = async (params, bitacora) => {
  const { LoggedUser, dbServer } = params;

  try {
    // 1. Ejecución del servicio
    let result = await runService(dbServer, "getAll");

    // Parseo seguro (por si runService devuelve algo que no es JSON string)
    let parsedResult;
    try {
      parsedResult = typeof result === "string" ? JSON.parse(result) : result;
    } catch (e) {
      throw new Error("La respuesta del servicio no es un JSON válido");
    }

    // 2. CASO ÉXITO (Status 200)
    if (parsedResult.status === 200) {
      bitacora.data.push(parsedResult.data);
      bitacora.countData =
        parsedResult.results ||
        (Array.isArray(parsedResult.data) ? parsedResult.data.length : 0);
      bitacora.success = true;
      bitacora.status = 200;
      bitacora.loggedUser = LoggedUser;
      bitacora.dbServer = dbServer || "mongo";
      bitacora.messageUSR = "Errores recuperados correctamente";
      bitacora.messageDEV = `GetAll ejecutado correctamente en [${
        dbServer || "mongo"
      }]`;
    }
    // 3. CASO FALLO LÓGICO (El servicio respondió, pero con error, ej: 500, 400)
    else {
      bitacora.success = false;
      bitacora.status = parsedResult.status || 500;
      bitacora.loggedUser = LoggedUser;
      bitacora.dbServer = dbServer || "mongo";
      bitacora.messageUSR = "Hubo un problema al recuperar los errores.";
      bitacora.messageDEV = `Fallo en GetAll [${dbServer || "mongo"}]: ${
        parsedResult.message || "Error desconocido"
      }`;

      // Notificar el fallo
      if (dotenvXConfig.SEND_NOTIFICATIONS === "true") {
        try {
          // Usamos el objeto devuelto por el servicio como fuente del error
          const errorInfo = parsedResult.data || parsedResult;
          errorInfo.message = `Fallo en GetAll [${dbServer || "mongo"}]:`;
          const parsedError = await parseErrorNoti.parseError(errorInfo);
          console.log("=========================");
          console.log(parsedError);
          await sendSystemNotification(parsedError);
        } catch (notifyErr) {
          console.error("⚠️ Error al notificar fallo en GetAll:", notifyErr);
        }
      }
    }
  } catch (err) {
    // 4. CASO CRASH (Excepción no controlada, ej: timeout, red, sintaxis)
    console.error("❌ Crash crítico en getAllFunction:", err);

    bitacora.success = false;
    bitacora.status = 500;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = dbServer || "mongo";
    bitacora.messageUSR = "Error crítico al conectar con el servicio de datos.";
    bitacora.messageDEV = `Excepción en GetAll: ${err.message}`;

    // Notificar el crash
    if (dotenvXConfig.SEND_NOTIFICATIONS === "true") {
      try {
        // console.log('=====================')
        // console.log(parsed)
        // Pasamos el error nativo para que parseError detecte el tipo (ej: CONEXION, INFRAESTRUCTURA)
        err.message = `Fallo en GetAll [${dbServer || "mongo"}]:`;
        const parsedError = await parseErrorNoti.parseError(err);
        await sendSystemNotification(parsedError);
      } catch (notifyErr) {
        console.error("⚠️ Error al notificar crash:", notifyErr);
      }
    }
  }

  return bitacora;
};

// === GET ONE ===
const getOneFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  const id = body?.data?._id || body?.data?.rowKey || params?.id;
  let result = await runService(dbServer, "getOne", id);
  result = JSON.parse(result);

  bitacora.data.push(result.data);
  bitacora.countData = 1;
  bitacora.success = true;
  bitacora.status = result.status === 404 ? 404 : 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR =
    result.status === 404
      ? "Error no encontrado"
      : "Error recuperado correctamente";
  bitacora.messageDEV = "GetOne ejecutado correctamente";
  return bitacora;
};

// === ADD ===
const addFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  let payload = body.data;

  // 1) PARSEAR STRING
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (err) {
      // <--- Aquí SÍ existe 'err', pero su vida acaba al cerrar la llave }
      console.error("❌ Error parseando body.data:", body.data);
      return {
        status: 400,
        messageUSR: "Error al parsear el JSON recibido.",
        messageDEV: err.message,
      };
    }
  }

  // 2) INSERTAR
  const result = await runService(dbServer, "add", payload);
  const parsed = JSON.parse(result);

  // 3) ÉXITO (201)
  if (parsed.status === 201 && dotenvXConfig.SEND_NOTIFICATIONS === "true") {
    try {
      await sendSystemNotification(parsed);
    } catch (notificationErr) {
      // <--- Usar nombre específico para no confundir
      // console.log("Error al enviar notificación de éxito");
    }
  }

  // Llenar bitácora común
  bitacora.data.push(parsed.data);
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;

  // 4) MANEJO DEL ERROR (NO 201)
  if (parsed.status != 201) {
    bitacora.success = false; // Corregido: Si falló, success debería ser false
    bitacora.status = parsed.status || 500;
    bitacora.messageUSR = "Error al intentar insertar";
    bitacora.messageDEV = `Fallo en Insert [${
      dbServer || "mongo"
    }]: ${JSON.stringify(parsed.data)}`;

    // ✅ CORRECCIÓN: Usamos 'parsed.data' o el objeto 'parsed' en lugar de 'err'
    // Asumimos que parsed.data contiene el mensaje o detalle del error
    const errorInfo = parsed;
    errorInfo.message = bitacora.messageDEV;

    try {
      if (dotenvXConfig.SEND_NOTIFICATIONS === "true") {
        const parsedError = await parseErrorNoti.parseError(errorInfo);
        // console.log("Error parseado:", parsedError);
        await sendSystemNotification(parsedError);
      }
    } catch (parseEx) {
      console.error("Error al intentar notificar el fallo:", parseEx);
    }
  } else {
    // ÉXITO
    bitacora.success = true;
    bitacora.status = 201;
    bitacora.messageUSR = "Error insertado correctamente";
    bitacora.messageDEV = `Insert ejecutado correctamente en [${
      dbServer || "mongo"
    }]`;
  }

  return bitacora;
};

// === UPDATE ===
const updateFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  let payload = body.data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {}
  }

  const result = await runService(dbServer, "update", payload);
  const parsed = JSON.parse(result);

  bitacora.data.push(parsed.data);
  bitacora.success = parsed.status === 200;
  bitacora.status = parsed.status;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = parsed.message || "Error actualizado correctamente";
  bitacora.messageDEV = "Update ejecutado correctamente";
  return bitacora;
};

// === DELETE ===
const deleteFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  const id = body?.data?._id || body?.data?.rowKey || params?.id;

  const result = await runService(dbServer, "delete", id);
  const parsed = JSON.parse(result);

  bitacora.data.push(parsed.data);
  bitacora.countData = 1;
  bitacora.success = parsed.status === 200;
  bitacora.status = parsed.status;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = parsed.message || "Error eliminado correctamente";
  bitacora.messageDEV = "Delete ejecutado correctamente";
  return bitacora;
};

// const gatAiFuncttion = async (params,bitacora,body) => {

// }

// === EXPORT ===
export const functionsDic = {
  getAll: getAllFunction,
  getOne: getOneFunction,
  add: addFunction,
  update: updateFunction,
  delete: deleteFunction,
};
