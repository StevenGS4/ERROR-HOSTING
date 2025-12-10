import dotenvXConfig from "./../config/dotenvXConfig.js";
import { detectTypeError } from "./detectTypeError.js";

const parseError = async (err) => {
  console.error("🔴 Parsing error:", err); // Usar console.error es mejor para logs
 

  // 1. Construimos el objeto base
  const newError = {
    data: {
      ERRORMESSAGE: err.message,
      ERRORCODE: `ERR-${err.status}`,
      ERRORSOURCE: err.source || "BACKEND",
      TYPE_ERROR: detectTypeError(err),
      CONTEXT: [
        {
          // Intentamos guardar el stack real si existe, si no, el objeto entero
          stack: err?.stack || err,
          originalMessage: err?.message || "Sin mensaje detallado",
        },
      ],
      SEVERITY: "ERROR",
      MODULE: "errores",
      APPLICATION: "ERRORES BACKEND",
      CANSEEUSERS: [], // Inicializamos vacío por seguridad
    },
  };

  const { MODULE } = newError.data;

  // 2. Intentamos obtener los usuarios (envuelto en try/catch para no romper el flujo principal)
  try {
    const response = await fetch(
      `${dotenvXConfig.DOMINIO_USUARIOS}?ProcessType=getAll&DBServer=MongoDB&LoggedUser=AGUIZARE`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Es más limpio que pasar "{}" string
      }
    );

    if (!response.ok) {
      throw new Error(`Error en servicio usuarios: ${response.statusText}`);
    }

    const data = await response.json();

    // Acceso seguro con Fallback a array vacío
    const usuarios = data?.value?.[0]?.data?.[0]?.dataRes || [];

    const filtrados = usuarios
      .filter((u) =>
        u.ROLES?.some((r) =>
          r.ROLEID?.toLowerCase().includes(MODULE.toLowerCase())
        )
      )
      .map((u) => u.USERID);

    newError.data.CANSEEUSERS = filtrados;

    console.log("✅ Usuarios notificados:", filtrados.length);
  } catch (userFetchError) {
    // Si falla la obtención de usuarios, solo lo logueamos, pero NO detenemos el proceso
    // Así al menos devolvemos el error de MongoDB aunque sin destinatarios.
    console.warn(
      "⚠️ No se pudieron obtener los usuarios para notificar:",
      userFetchError.message
    );
  }

  // 3. ¡IMPORTANTE! Devolver el objeto
  return newError;
};

export default { parseError };
