// srv/api/models/zterrorlog-model.js
import mongoose from "mongoose";

const zterrorlogSchema = new mongoose.Schema(
  {
    // ======================================================
    // 🆕 NUEVOS CAMPOS AGREGADOS
    // ======================================================
    ERRORID: {
      type: String,
      default: () => Date.now(),
    },

    CANSEEUSERS: {
      type: [String],
      default: [],
    },

    ASIGNEDUSERS: {
      type: [String],
      default: [],
    },

    RESOLVEDBY: {
      type: String,
      default: null,
    },

    RESOLVED_DATE: {
      type: Date,
      default: null,
    },

    COMMENTS: {
      type: [Object],
      default: [],
    },

    FINALSOLUTION: {
      type: String,
      default: null,
    },

    USER_SESSION_LOG: {
      type: [String],
      default: [],
    },


    // ======================================================
    // 🔧 CONTEXT — actualizado para coincidir con los nuevos datos
    // ======================================================
    CONTEXT: {
      type: [
        {
          stack: { type: String },
          endponint: { type: String },
          requestBody: { type: Object },
          browser: { type: Object },
          errorMessageRaw: { type: String },
          stackTrace: { type: Array },
          component: { type: String },
          function: { type: String },
          httpRequest: { type: Object },
          timestamp: { type: String }
        },
      ],
      default: [],
    },

    // ======================================================
    // CAMPOS ORIGINALES (NO SE TOCARON)
    // ======================================================
    ERRORMESSAGE: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    ERRORDATETIME: {
      type: Date,
      default: Date.now,
      required: true,
    },

    ERRORCODE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    ERRORSOURCE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    AI_REQUESTED: {
      type: Boolean,
      default: false,
    },

    AI_RESPONSE: {
      type: String,
      maxlength: 5000,
      default: null,
    },

    STATUS: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "RESOLVED", "IGNORED"],
      default: "NEW",
    },

    SEVERITY: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "ERROR",
    },

    TYPE_ERROR: { //NUEVO
      type: String,
      enum: [
        "ALERT",
        "WARNING",
        "INFO",
        "SERVIDOR",
        "DATABASE",
        "INFRAESTRUCTURA",
        "EXTERNO",
        "FRONTEND",
        "UI",
        "COMPATIBILIDAD",
        "LOGICO",
        "HUMANO",
        "VALIDACION",
        "NEGOCIO",
        "PROCESO",
        "INTEGRACION",
        "SEGURIDAD",
        "AUTH",
        "FRAUDE",
        "PRODUCCION",
        "QA",
        "SANDBOX",
        "OTRO"
      ],
      default: "ALERT",
    },

    MODULE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    APPLICATION: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    CREATED_BY_APP: {
      type: String,
      trim: true,
      default: null
    },

    PROCESS: {
      type: String,
      default: null,
      maxlength: 500,
    },

    ENVIRONMENT: {
      type: String,
      enum: ["DEV", "TEST", "PROD"],
      default: "DEV",
    },

    DEVICE: {
      type: String,
      default: null,
    },
  },
  { collection: "ZTERRORLOG" }
);

export default mongoose.model("ZTERRORLOG", zterrorlogSchema);
