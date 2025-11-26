import zterrorlog from '../models/mongodb/zterrorlog.js';
import { getAISolution } from "../services/ai-service.js";


// ====================================================================
// 🧠 AUTO-DETECTOR DE TYPE_ERROR — LÓGICA EXPANDIDA PROFESIONAL
// ====================================================================
function detectTypeError(error) {
  const msg = (error.ERRORMESSAGE || "").toLowerCase();
  const src = (error.ERRORSOURCE || "").toLowerCase();
  const mod = (error.MODULE || "").toLowerCase();
  const ctx = JSON.stringify(error.CONTEXT || "").toLowerCase();

  // === ERRORES DE SERVICIO, RED, EXTERNOS ===
  if (msg.includes("network") || msg.includes("timeout") || src.includes("axios"))
    return "EXTERNO";

  if (msg.includes("fetch") || msg.includes("connection") || msg.includes("proxy"))
    return "EXTERNO";

  // === ERRORES DE FRONTEND ===
  if (src.includes("jsx") || src.includes("component") || mod.includes("frontend"))
    return "FRONTEND";

  if (msg.includes("undefined") || msg.includes("cannot read") || msg.includes("react"))
    return "FRONTEND";

  // === ERRORES DE UI / UX ===
  if (msg.includes("css") || msg.includes("style") || src.includes("ui"))
    return "UI";

  if (msg.includes("not visible") || msg.includes("layout") || msg.includes("responsive"))
    return "UI";

  // === ERRORES DE BACKEND / SERVIDOR ===
  if (mod.includes("backend") || src.includes("server") || msg.includes("node"))
    return "SERVIDOR";

  if (msg.includes("uncaught exception") || msg.includes("internal server error"))
    return "SERVIDOR";

  // === ERRORES DE BASE DE DATOS ===
  if (msg.includes("sql") || msg.includes("mongo") || msg.includes("query"))
    return "DATABASE";

  if (msg.includes("constraint") || msg.includes("duplicate key") || msg.includes("index"))
    return "DATABASE";

  // === ERRORES DE SEGURIDAD ===
  if (msg.includes("auth") || msg.includes("token") || msg.includes("jwt"))
    return "AUTH";

  if (msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("permission"))
    return "SEGURIDAD";

  if (msg.includes("suspicious") || msg.includes("fraud") || msg.includes("malicious"))
    return "FRAUDE";

  // === ERRORES DE VALIDACIÓN ===
  if (msg.includes("invalid") || msg.includes("required") || msg.includes("format"))
    return "VALIDACION";

  if (msg.includes("missing") || msg.includes("not provided"))
    return "VALIDACION";

  // === ERRORES DE PROCESO / NEGOCIO ===
  if (msg.includes("stock") || msg.includes("inventario") || msg.includes("pedido"))
    return "NEGOCIO";

  if (msg.includes("sync") || msg.includes("workflow") || msg.includes("proceso"))
    return "PROCESO";

  // === ERRORES DE INTEGRACIÓN INTERNA ===
  if (msg.includes("microservice") || msg.includes("queue") || msg.includes("integration"))
    return "INTEGRACION";

  // === ERRORES HUMANOS ===
  if (msg.includes("not found") || msg.includes("invalid input") || msg.includes("mistyped"))
    return "HUMANO";

  // === AMBIENTES ===
  if (msg.includes("production") || msg.includes("critical in prod"))
    return "PRODUCCION";

  if (msg.includes("qa") || msg.includes("testing"))
    return "QA";

  if (msg.includes("sandbox") || msg.includes("dev"))
    return "SANDBOX";

  // === WARNINGS / INFO ===
  if (msg.includes("warning"))
    return "WARNING";

  if (msg.includes("info"))
    return "INFO";

  // === ÚLTIMO RECURSO ===
  return "OTRO";
}




// ====================================================================
// === GET ALL ===
const GetAllErrors = async () => {
  try {
    const errors = await zterrorlog.find().lean();
    return JSON.stringify({
      status: 200,
      results: errors.length,
      data: errors,
    });
  } catch (error) {
    console.error("❌ [GetAllErrors] Error:", error);
    return JSON.stringify({
      status: 500,
      message: "Error retrieving errors",
      data: [],
      error: error.message,
    });
  }
};

// ====================================================================
// === GET ONE ===
const GetOneError = async (id) => {
  try {
    const error = await zterrorlog.findById(id).lean();
    if (!error) {
      return JSON.stringify({
        status: 404,
        message: `Error with ID ${id} not found`,
        data: [],
      });
    }
    return JSON.stringify({
      status: 200,
      data: error,
    });
  } catch (error) {
    console.error("❌ [GetOneError] Error:", error);
    return JSON.stringify({
      status: 500,
      message: "Internal error in GetOneError",
      data: [],
      error: error.message,
    });
  }
};

// ====================================================================
// === INSERT ONE ===
const InsertOneError = async (error) => {
  try {
    // Si llega como string, intenta parsear
    if (typeof error === "string") {
      try {
        error = JSON.parse(error);
      } catch {
        return JSON.stringify({
          status: 400,
          message: "Invalid JSON format",
          data: [],
        });
      }
    }

    console.log("🔥 INSERT PAYLOAD RECIBIDO:", error);

    // AUTO-DETECTOR
    if (!error.TYPE_ERROR) error.TYPE_ERROR = detectTypeError(error);

    const newError = await zterrorlog.create(error);

    return JSON.stringify({
      status: 201,
      message: "Error inserted successfully",
      data: newError,
    });

  } catch (error) {
    console.error("❌ [InsertOneError] Error:", error);
    return JSON.stringify({
      status: 500,
      message: "Internal error inserting error",
      data: [],
      error: error.message,
    });
  }
};

// ====================================================================
// === UPDATE ONE ===
const UpdateOneError = async (error) => {
  const { _id } = error;
  try {
    const editedError = await zterrorlog.findOneAndUpdate({ _id }, error, { new: true });
    if (!editedError) {
      return JSON.stringify({
        status: 404,
        message: `Error with ID ${_id} not found`,
        data: [],
      });
    }
    return JSON.stringify({
      status: 200,
      message: "Error updated successfully",
      data: editedError,
    });
  } catch (error) {
    console.error("❌ [UpdateOneError] Error:", error);
    return JSON.stringify({
      status: 500,
      message: "Internal error updating error",
      data: [],
      error: error.message,
    });
  }
};

// ====================================================================
// === DELETE ONE ===
const DeleteOneError = async (id) => {
  try {
    const deletedError = await zterrorlog.findByIdAndDelete(id);
    if (!deletedError) {
      return JSON.stringify({
        status: 404,
        message: `Error with ID ${id} not found`,
        data: [],
      });
    }
    return JSON.stringify({
      status: 200,
      message: "Error deleted successfully",
      data: deletedError,
    });
  } catch (error) {
    console.error("❌ [DeleteOneError] Error:", error);
    return JSON.stringify({
      status: 500,
      message: "Internal error deleting error",
      data: [],
      error: error.message,
    });
  }
};

export default {
  GetAllErrors,
  GetOneError,
  InsertOneError,
  UpdateOneError,
  DeleteOneError,
};
