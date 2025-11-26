// srv/api/services/crud-service.js
import respPWA from './../../middlewares/respPWA-bitacora.js';
import { functionsDic } from '../../helpers/queryDic.js';



const { OK, FAIL, BITACORA } = respPWA;

export const crudErrores = async (params, body) => {
  let bitacora = BITACORA();
  const { queryType, LoggedUser, dbServer } = params;

  try {
    // 1️⃣ Validar tipo de query
    if (!functionsDic[queryType]) {
      const msg = `Tipo de consulta no soportado: ${queryType}`;
      bitacora.success = false;
      bitacora.status = 402;
      bitacora.messageUSR = msg;
      bitacora.messageDEV = msg;
      bitacora.dbServer = dbServer || 'no especificado';
      bitacora.loggedUser = LoggedUser || 'anónimo';
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }

    // 2️⃣ Validar parámetros requeridos
    const missing = Object.entries({ LoggedUser, dbServer, queryType })
      .filter(([_, val]) => !val)
      .map(([key]) => key);

    if (missing.length > 0) {
      const msg = `Faltan parámetros: ${missing.join(', ')}`;
      bitacora.success = false;
      bitacora.status = 512;
      bitacora.messageUSR = msg;
      bitacora.messageDEV = msg;
      bitacora.dbServer = dbServer || 'desconocido';
      bitacora.loggedUser = LoggedUser || 'anónimo';
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }

    // 3️⃣ Ejecutar función correspondiente
    bitacora = await functionsDic[queryType](params, bitacora, body);

    // 4️⃣ Retornar resultado estructurado
    return bitacora.success ? OK(bitacora) : FAIL(bitacora);
  } catch (err) {
    // 5️⃣ Error general
    bitacora.success = false;
    bitacora.status = 500;
    bitacora.messageUSR = 'Error interno en crudErrores';
    bitacora.messageDEV = err.message;
    bitacora.finalRes = true;
    return FAIL(bitacora);
  }
};
