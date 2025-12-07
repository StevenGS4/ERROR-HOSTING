import { whatTypeVarIs } from './../helpers/variables.js';

const BITACORA = () => {
  const bitacora = {
    success: false,
    status: 0,
    messageUSR: '',
    messageDEV: '',
    countData: 0,
    dbServer: '',
    data: [],
    loggedUser: '',
    finalRes: false,
  };
  return bitacora;
};

const DATA = () => ({
  success: false,
  status: 0,
  process: '',
  principal: false,
  secuencia: 0,
  countDataReq: 0,
  countDataRes: 0,
  countFile: 0,
  messageUSR: '',
  messageDEV: '',
  method: '',
  api: '',
  dataReq: [],
  dataRes: [],
  file: [],
});

const AddMSG = (bitacora, data, tipo, status = 500, principal = false) => {
  if (tipo === 'OK') {
    data.success = data.success || true;
    bitacora.success = data.sucess || true;
  } else {
    data.success = data.success || false;
    bitacora.success = data.sucess || false;
  }

  data.status = data.status || status;
  data.process = data.process || 'No Especificado';
  data.principal = data.principal || principal;
  data.method = data.method || 'No Especificado';
  data.api = data.api || 'No Especificado';
  data.secuencia++;

  if (data.messageDEV) bitacora.messageDEV = data.messageDEV;
  if (data.messageUSR) bitacora.messageUSR = data.messageUSR;

  if (data.dataReq) {
    if (whatTypeVarIs(data.dataReq) === 'isArray')
      data.countDataReq = data.dataReq.length;
    else if (whatTypeVarIs(data.dataReq) === 'isObject')
      data.countDataReq = 1;
    else data.countDataReq = 0;
  }

  if (data.dataRes) {
    if (whatTypeVarIs(data.dataRes) === 'isArray')
      data.countDataRes = data.dataRes.length;
    else if (whatTypeVarIs(data.dataRes) === 'isObject')
      data.countDataRes = 1;
    else data.countDataRes = 0;
  }

  bitacora.status = data.status;
  bitacora.data.push(data);
  bitacora.countData++;
  return bitacora;
};

const OK = (bitacora) => ({
  success: bitacora.success || true,
  status: bitacora.status || 200,
  messageUSR: bitacora.messageUSR || 'OK',
  messageDEV: bitacora.messageDEV || '',
  countData: bitacora.countData || 0,
  data: bitacora.data || [],
  loggedUser: bitacora.loggedUser || 'system',
  finalRes: true,
});

const FAIL = (bitacora) => ({
  success: false,
  status: bitacora.status || 500,
  messageUSR: bitacora.messageUSR || 'Error interno',
  messageDEV: bitacora.messageDEV || 'Error interno en FAIL',
  countData: bitacora.countData || 0,
  data: bitacora.data || [],
  loggedUser: bitacora.loggedUser || 'system',
  finalRes: true,
});

export default {
  BITACORA,
  DATA,
  AddMSG,
  OK,
  FAIL,
};
