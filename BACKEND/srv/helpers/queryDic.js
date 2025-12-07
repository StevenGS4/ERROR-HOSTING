import mongoService from "../api/services/zterrorlog-service.js";
import dotenvXConfig from "../config/dotenvXConfig.js";
import azureService from "./../api/services/azure-zterrorlog-service.js";

// ====================================================================
// 🛠️ HELPER: SELECTOR DE SERVICIO
// ====================================================================
/**
 * Decide qué servicio usar y normaliza la ejecución del método
 */
const runService = async (dbServer, action, payload = null) => {
  const isAzure = dbServer.toLowerCase() === "azure";
  console.log(dbServer)

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

    default:
      throw new Error(`Acción ${action} no soportada`);
  }
};

// ====================================================================
// 🔔 HELPER: NOTIFICACIÓN SISTEMA
// ====================================================================
const sendSystemNotification = async (errorResponse) => {
  const errorPayload = errorResponse.data;
  // console.log("=================================");
  // console.log(errorPayload);
  try {
    // Definimos el resumen del error (ajusta la propiedad según tu objeto de error real, ej: message, error, description)
    const errorSummary =
      errorPayload.ERRORMESSAGE ||
      errorPayload.error ||
      "Nuevo error registrado sin detalle";

    // Obtenemos el módulo para el canal. Si no viene, usamos un default.
    const channelModule = errorPayload.MODULE || "GENERAL";

    const RECEIPTS = errorPayload.CANSEEUSERS;
    console.log(RECEIPTS);

    function getChannelId(data) {
      if (!data) return null;

      // Si viene como arreglo
      if (Array.isArray(data)) {
        if (data.length === 0) return null;
        return data[0]?.CHANNELID ?? null;
      }

      // Si viene como objeto
      if (typeof data === "object") {
        return data.CHANNELID ?? null;
      }

      return null; // Si viene algo raro
    }

    const fetchChannels = async () => {
      const responses = await Promise.all(
        RECEIPTS.map(async (rec) => {
          const res = await fetch(
            `${dotenvXConfig.DOMINIO_NOTIFICACOINES}channels/getChannelsSummary`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                USERID: rec,
                DBTYPE: "mongo",
              }),
            }
          );

          if (!res.ok) {
            console.error(
              "❌ Error obteniendo canales para usuario:",
              rec.USERID
            );
            return null;
          }

          const data = await res.json();
          const parsedRes = JSON.parse(data.value); // ← este es el resultado de la petición
          return getChannelId(parsedRes);
        })
      );

      return responses; // ← arreglo de resultados para cada RECEIPT
    };

    console.log(await fetchChannels());
    const CHANNELS = await fetchChannels();
    console.log(errorPayload);
    const notificationBody = {
      CONTENT: errorSummary,
      RECEIPTS,
      CHANNELS,
      LINK:
        `${dotenvXConfig.FRONTEND_DOMINIO}/${
          errorPayload._id || errorPayload.ERRORID || errorPayload.rowKey
        }` || null,
    };

    console.log(notificationBody.LINK);

    // console.log("=================================");
    console.log(notificationBody);

    const response = await fetch(
      `${dotenvXConfig.DOMINIO_NOTIFICACOINES}messages/sendNotificacionSistema`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationBody),
      }
    );

    if (!response.status === 200) {
      console.error(
        `⚠️ Error enviando notificación a CarbonChat: ${response.statusText}`
      );
    }
    if (response.status === 200) {
      console.error(`se mandó noti  ${response.statusText}`);
    }
  } catch (error) {
    // Capturamos error para no detener el flujo principal si falla la notificación
    console.error("❌ Excepción al enviar notificación de sistema:", error);
  }
};

// ====================================================================
// 🟢 FUNCIONES DEL DICCIONARIO
// ====================================================================

// === GET ALL ===
const getAllFunction = async (params, bitacora) => {
  const { LoggedUser, dbServer } = params;
  console.log(dbServer);
  let result = await runService(dbServer, "getAll");
  result = JSON.parse(result);

  bitacora.data.push(result.data);
  bitacora.countData =
    result.results || (Array.isArray(result.data) ? result.data.length : 0);
  bitacora.success = true;
  bitacora.status = 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer || "mongo";
  bitacora.messageUSR = "Errores recuperados correctamente";
  bitacora.messageDEV = `GetAll ejecutado correctamente en [${
    dbServer || "mongo"
  }]`;
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

  // 1) PARSEAR STRING SI ES NECESARIO
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (err) {
      console.error("❌ Error parseando body.data:", body.data);
      return {
        status: 400,
        messageUSR: "Error al parsear el JSON recibido.",
        messageDEV: err.message,
      };
    }
  }

  // 2) INSERTAR USANDO EL SELECTOR
  const result = await runService(dbServer, "add", payload);
  const parsed = JSON.parse(result);
  console.log("deeeeeeeeeeeeeeeeeeeeeeee");
  console.log(parsed);

  // 3) 🔔 NOTIFICAR A CARBONCHAT
  // Ejecutamos la notificación solo si el servicio devolvió éxito (o siempre, según prefieras).
  // Aquí asumo que parsed.status o la existencia de data implica éxito.
  console.log(dotenvXConfig.SEND_NOTIFICATIONS);
  if (parsed && dotenvXConfig.SEND_NOTIFICATIONS === "true") {
    // console.log(parsed);
    // Pasamos el payload original que contiene 'modulo' y el mensaje
    // Usamos await si queremos asegurar que se envíe antes de responder,
    // o quitamos await para "fire and forget" y que responda más rápido al usuario.
    try {
      await sendSystemNotification(parsed); // asegura envío
      console.log("✔ Notificación enviada");
    } catch (err) {
      console.error("❌ Error enviando notificación:", err);
    }
  }

  bitacora.data.push(parsed.data);
  bitacora.success = true;
  bitacora.status = 201;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = "Error insertado correctamente";
  bitacora.messageDEV = `Insert ejecutado correctamente en [${
    dbServer || "mongo"
  }]`;

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

// === EXPORT ===
export const functionsDic = {
  getAll: getAllFunction,
  getOne: getOneFunction,
  add: addFunction,
  update: updateFunction,
  delete: deleteFunction,
};
