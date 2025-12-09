import dotenvXConfig from "../config/dotenvXConfig.js";

const diccCanalesFijo = {
  mensajeria: "6937bd2690c6bfaf620f224a",
  notificaciones: "6937bd2690c6bfaf620f224a",
  
};

export const sendSystemNotification = async (errorResponse) => {
  console.log(errorResponse)
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
            `${dotenvXConfig.DOMINIO_NOTIS}channels/getChannelsSummary`,
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

      return responses;
    };

    console.log(await fetchChannels());
    const CHANNELS = await fetchChannels();

    //ASIGNACION DE CANAL FIJO
    if (diccCanalesFijo[errorPayload.MODULE]) {
      console.log(diccCanalesFijo[errorPayload.MODULE]);
      CHANNELS.push(diccCanalesFijo[errorPayload.MODULE]);
    }

    console.log(errorPayload);

    const notificationBody = {
      CONTENT: errorSummary,
      RECEIPTS,
      CHANNELS,
      LINK:
        `${dotenvXConfig.FRONTEND_DOMINIO}/${
          errorPayload._id || errorPayload.ERRORID || errorPayload.rowKey
        }?user=` || null,
    };

    console.log(notificationBody);

    // console.log("=================================");
    console.log(notificationBody);

    const response = await fetch(
      `${dotenvXConfig.DOMINIO_NOTIS}messages/sendNotificacionSistema`,
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
