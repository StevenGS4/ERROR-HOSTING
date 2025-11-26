// srv/helpers/queryDic.js
import zterrorlogService from '../api/services/zterrorlog-service.js';

// === GET ALL ===
const getAllFunction = async (params, bitacora) => {
  const { LoggedUser, dbServer } = params;
  let result = await zterrorlogService.GetAllErrors();
  result = JSON.parse(result);
  bitacora.data.push(result.data);
  bitacora.countData = result.results || result.data.length;
  bitacora.success = true;
  bitacora.status = 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = 'Errores recuperados correctamente';
  bitacora.messageDEV = 'GetAll ejecutado correctamente';
  return bitacora;
};

// === GET ONE ===
const getOneFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  const id = body?.data?._id || params?.id;
  let result = await zterrorlogService.GetOneError(id);
  result = JSON.parse(result);
  bitacora.data.push(result.data);
  bitacora.countData = 1;
  bitacora.success = true;
  bitacora.status = 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = 'Error recuperado correctamente';
  bitacora.messageDEV = 'GetOne ejecutado correctamente';
  return bitacora;
};



// === ADD ===
const addFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;

  let payload = body.data; // ← puede venir como STRING

  // 🔥🔥🔥 1) SI ES STRING → PARSEARLO A OBJETO REAL
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

  // 🔥🔥🔥 2) Insertar EL OBJETO REAL, NO EL STRING
  const result = await zterrorlogService.InsertOneError(payload);
  const parsed = JSON.parse(result);

  // Armar bitácora
  bitacora.data.push(parsed.data);
  bitacora.success = true;
  bitacora.status = 201;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = "Error insertado correctamente";
  bitacora.messageDEV = "Insert ejecutado correctamente";

  return bitacora;
};


// === UPDATE ===
const updateFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  const result = await zterrorlogService.UpdateOneError(body.data);
  const parsed = JSON.parse(result);
  bitacora.data.push(parsed.data);
  bitacora.success = true;
  bitacora.status = 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = 'Error actualizado correctamente';
  bitacora.messageDEV = 'Update ejecutado correctamente';
  return bitacora;
};

// === DELETE ===
const deleteFunction = async (params, bitacora, body) => {
  const { LoggedUser, dbServer } = params;
  const id = body?.data?._id || params?.id;
  const result = await zterrorlogService.DeleteOneError(id);
  const parsed = JSON.parse(result);
  bitacora.data.push(parsed.data);
  bitacora.countData = 1;
  bitacora.success = true;
  bitacora.status = 200;
  bitacora.loggedUser = LoggedUser;
  bitacora.dbServer = dbServer;
  bitacora.messageUSR = 'Error eliminado correctamente';
  bitacora.messageDEV = 'Delete ejecutado correctamente';
  return bitacora;
};

// === EXPORT ===
export const functionsDic = {
  getAll: getAllFunction,
  getOne: getOneFunction,
  add: addFunction,
  update: updateFunction,
  delete: deleteFunction, // ✅ este es el que faltaba
};
