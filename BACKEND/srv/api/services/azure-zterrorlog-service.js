import { TableClient } from "@azure/data-tables";
import dotenvXConfig from "./../../config/dotenvXConfig.js";
import { getAISolution } from "./ai-service.js";

// ====================================================================
// 🧠 CONFIGURATION: ERROR CLASSIFICATION RULES
// ====================================================================
// Misma lógica que en MongoDB, reutilizable.
const ERROR_CLASSIFICATION_RULES = [
  {
    type: "EXTERNO",
    keywords: ["network", "timeout", "axios", "fetch", "connection", "proxy"],
  },
  {
    type: "FRONTEND",
    keywords: [
      "jsx",
      "component",
      "frontend",
      "undefined",
      "cannot read",
      "react",
    ],
  },
  {
    type: "UI",
    keywords: ["css", "style", "ui", "not visible", "layout", "responsive"],
  },
  {
    type: "SERVIDOR",
    keywords: [
      "backend",
      "server",
      "node",
      "uncaught exception",
      "internal server error",
    ],
  },
  {
    type: "DATABASE",
    keywords: ["sql", "mongo", "query", "constraint", "duplicate key", "index"],
  },
  { type: "AUTH", keywords: ["auth", "token", "jwt"] },
  { type: "SEGURIDAD", keywords: ["unauthorized", "forbidden", "permission"] },
  { type: "FRAUDE", keywords: ["suspicious", "fraud", "malicious"] },
  {
    type: "VALIDACION",
    keywords: ["invalid", "required", "format", "missing", "not provided"],
  },
  { type: "NEGOCIO", keywords: ["stock", "inventario", "pedido"] },
  { type: "PROCESO", keywords: ["sync", "workflow", "proceso"] },
  { type: "INTEGRACION", keywords: ["microservice", "queue", "integration"] },
  { type: "HUMANO", keywords: ["not found", "invalid input", "mistyped"] },
  { type: "PRODUCCION", keywords: ["production", "critical in prod"] },
  { type: "QA", keywords: ["qa", "testing"] },
  { type: "SANDBOX", keywords: ["sandbox", "dev"] },
  { type: "WARNING", keywords: ["warning"] },
  { type: "INFO", keywords: ["info"] },
];

// ====================================================================
// 🧠 LOGIC: AUTO-DETECTOR ENGINE
// ====================================================================
function detectTypeError(error) {
  const searchCorpus = `
    ${error.ERRORMESSAGE || ""} 
    ${error.ERRORSOURCE || ""} 
    ${error.MODULE || ""} 
    ${JSON.stringify(error.CONTEXT || "")}
  `;

  const match = ERROR_CLASSIFICATION_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchCorpus.includes(keyword))
  );

  return match ? match.type : "OTRO";
}

// ====================================================================
// 🔌 AZURE CLIENT SETUP
// ====================================================================
const connectionString = dotenvXConfig.AZURE_STRING;
const TABLE_NAME = "zterrorlog";
const PARTITION_KEY = "errorlogs"; // Usamos una partición fija para este log

const tableClient = TableClient.fromConnectionString(
  connectionString,
  TABLE_NAME
);

// Helpers para respuestas uniformes
const sendResponse = (status, message, data = [], error = null) => {
  return JSON.stringify({
    status,
    message,
    results: Array.isArray(data) ? data.length : 1,
    data,
    error,
  });
};

// Helper para parsear campos JSON que Azure devuelve como string
const parseEntity = (entity) => {
  const parsed = { ...entity };
  // Lista de campos que guardamos como stringify y debemos recuperar como objeto
  const jsonFields = [
    "CONTEXT",
    "CANSEEUSERS",
    "ASIGNEDUSERS",
    "COMMENTS",
    "AI_RESPONSE",
  ];

  jsonFields.forEach((field) => {
    if (parsed[field] && typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // Si falla, dejamos el string original
      }
    }
  });
  return parsed;
};

// ====================================================================
// === GET ALL ===
// ====================================================================
const getAllErrors = async () => {
  const results = [];
  try {
    // Azure Table devuelve un async iterable
    const entities = tableClient.listEntities();

    for await (const entity of entities) {
      // Importante: Azure incluye metadatos (odata), limpiamos y parseamos
      results.push(parseEntity(entity));
    }

    // Ordenamiento manual (Azure Table no tiene "ORDER BY" nativo eficiente en listEntities sin timestamp)
    results.sort(
      (a, b) => new Date(b.ERRORDATETIME) - new Date(a.ERRORDATETIME)
    );

    return sendResponse(200, "Success", results);
  } catch (error) {
    console.error("❌ [GetAllErrors] Error:", error);
    return sendResponse(
      500,
      "Error retrieving errors from Azure",
      [],
      error.message
    );
  }
};

// ====================================================================
// === GET ONE ===
// ====================================================================
const getError = async (rowKey) => {
  try {
    // En Azure necesitamos PartitionKey + RowKey para una búsqueda puntual eficiente
    const entity = await tableClient.getEntity(PARTITION_KEY, rowKey);
    return sendResponse(200, "Success", parseEntity(entity));
  } catch (error) {
    console.error("❌ [GetOneError] Error:", error);
    if (error.statusCode === 404) return sendResponse(404, "Error not found");
    return sendResponse(500, "Error retrieving record", [], error.message);
  }
};

// ====================================================================
// === INSERT ONE (With Logic + AI) ===
// ====================================================================
const addError = async (payload) => {
  console.log("===============================----------0000");
  console.log(Object.entries(payload));
  try {
    let errorData = payload;
    if (typeof payload === "string") {
      try {
        errorData = JSON.parse(payload);
      } catch {
        return sendResponse(400, "Invalid JSON");
      }
    }

    // 1. Auto-Detect Type
    if (!errorData.TYPE_ERROR) {
      errorData.TYPE_ERROR = detectTypeError(errorData);
    }

    // 2. AI Integration (Opcional)
    let aiSolutionText = null;
    try {
      if (["SERVIDOR", "DATABASE", "CODE"].includes(errorData.TYPE_ERROR)) {
        // Asumimos que getAISolution devuelve un string
        aiSolutionText = await getAISolution(errorData.ERRORMESSAGE);
      }
    } catch (aiErr) {
      console.warn("⚠️ AI Service skipped:", aiErr.message);
    }
    const { MODULE } = errorData;
    try {
      const response = await fetch(
        `${dotenvXConfig.DOMINIO_USUARIOS}?ProcessType=getAll&DBServer=MongoDB&LoggedUser=AGUIZARE`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{}",
        }
      );

      const data = await response.json();
      console.log("%%%");
      // console.log(data?.value?.[0]?.data?.[0]?.dataRes);
      const usuarios = data?.value?.[0]?.data?.[0]?.dataRes;
      const filtrados = usuarios
        .filter((u) =>
          u.ROLES?.some((r) =>
            r.ROLEID.toLowerCase().includes(MODULE.toLowerCase())
          )
        )
        .map((u) => u.USERID);
      errorData.CANSEEUSERS = filtrados;

      console.log(errorData.CANSEEUSERS);
    } catch (err) {
      console.error("Error AL OBTENER USUARIOS:", err);
      // setErrorMsg("Usuario no encontrado");
    }

    // 3. Preparar Entidad para Azure (Flattening & Stringifying)
    // Azure no acepta arrays ni objetos anidados directamente.
    const newEntity = {
      partitionKey: PARTITION_KEY,
      rowKey:
        errorData.rowKey ||
        `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // RowKey único

      ERRORMESSAGE: errorData.ERRORMESSAGE || "No message",
      ERRORDATETIME: new Date().toISOString(),
      ERRORCODE: errorData.ERRORCODE || "N/A",
      ERRORSOURCE: errorData.ERRORSOURCE || "Unknown",
      SEVERITY: errorData.SEVERITY || "Low",
      TYPE_ERROR: errorData.TYPE_ERROR,
      MODULE: errorData.MODULE || "General",
      STATUS: "NEW",

      // JSON Stringified Fields
      CONTEXT: JSON.stringify(errorData.CONTEXT || {}),
      CANSEEUSERS: JSON.stringify(errorData.CANSEEUSERS || ["JEFEPROD"]),
      ASIGNEDUSERS: JSON.stringify(errorData.ASIGNEDUSERS || []),
      COMMENTS: JSON.stringify([]),

      // AI Fields
      AI_REQUESTED: !!aiSolutionText,
      AI_RESPONSE: aiSolutionText || null,

      // Otros campos planos
      APPLICATION: errorData.APPLICATION,
      PROCESS: errorData.PROCESS,
      ENVIRONMENT: errorData.ENVIRONMENT,
      DEVICE: errorData.DEVICE,
    };

    await tableClient.createEntity(newEntity);

    return sendResponse(
      201,
      "Error inserted successfully in Azure",
      parseEntity(newEntity)
    );
  } catch (err) {
    console.error("❌ [AddError] Azure Insert Error:", err);
    return sendResponse(500, "Internal Error", [], err.message);
  }
};

// ====================================================================
// === UPDATE ONE (CORREGIDO Y SANITIZADO) ===
// ====================================================================
const updateError = async (payload) => {
  // Payload debe incluir rowKey para saber cuál actualizar
  const { rowKey, ...updates } = payload;

  if (!rowKey) return sendResponse(400, "RowKey is required for update");

  try {
    // 1. Obtener la entidad actual (Strategy: Merge)
    const currentEntity = await tableClient.getEntity(PARTITION_KEY, rowKey);

    // 2. Preparar los updates
    const updatedFields = { ...updates };

    // Lista de campos prohibidos que Azure envía al leer pero rechaza al escribir
    const SYSTEM_FIELDS = [
      "odata.metadata",
      "odata.etag",
      "Timestamp",
      "PartitionKey",
      "RowKey",
    ];

    // 3. LIMPIEZA Y STRINGIFY AUTOMÁTICO
    Object.keys(updatedFields).forEach((key) => {
      // A) Si es un campo de sistema o empieza con "odata.", LO BORRAMOS
      if (SYSTEM_FIELDS.includes(key) || key.startsWith("odata.")) {
        delete updatedFields[key];
        return; // Pasamos al siguiente
      }

      const value = updatedFields[key];

      // B) Si es un Objeto o Arreglo (y no es Fecha), lo convertimos a String
      if (value && typeof value === "object" && !(value instanceof Date)) {
        updatedFields[key] = JSON.stringify(value);
      }
    });

    // 4. Ejecutar Update en Azure
    await tableClient.updateEntity(
      {
        partitionKey: PARTITION_KEY,
        rowKey: rowKey,
        ...updatedFields,
      },
      "Merge"
    );

    // 5. Devolver respuesta fusionada
    const rawMerged = { ...currentEntity, ...updatedFields };
    const cleanMerged = parseEntity(rawMerged);

    return sendResponse(200, "Updated successfully", cleanMerged);
  } catch (error) {
    console.error("❌ [UpdateError] Error:", error);
    // Agregamos detalle del error para debugging
    const errorDetails =
      error.details?.odataError?.message?.value || error.message;
    return sendResponse(500, "Error updating entity", [], errorDetails);
  }
};

// ====================================================================
// === DELETE ONE ===
// ====================================================================
const deleteError = async (rowKey) => {
  try {
    await tableClient.deleteEntity(PARTITION_KEY, rowKey);
    return sendResponse(200, "Deleted successfully", { rowKey });
  } catch (error) {
    console.error("❌ [DeleteError] Error:", error);
    return sendResponse(500, "Error deleting entity", [], error.message);
  }
};

export default {
  getAllErrors,
  getError,
  addError,
  updateError,
  deleteError,
};
