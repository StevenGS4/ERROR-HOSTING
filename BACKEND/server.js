// server.js — SAP CAP + Express + MongoDB + CORS + PWA + Logging + Azure-ready
import express from "express";
import cds from "@sap/cds";
import cors from "cors";

import { connectToMongo } from "./srv/config/connectToMongo.js";
import respPWA from "./srv/middlewares/respPWA.handler.js";

import iaRoute from "./srv/api/routes/ia-route.js";
import azureZterrorlogService from "./srv/api/services/azure-zterrorlog-service.js";

import { getAISolution } from "./srv/api/services/ai-service.js";
import zterrorlog from "./srv/api/models/mongodb/zterrorlog.js";

// ⭐ AUTO-ASIGNACIÓN (automático)

// ⭐ ASIGNACIÓN MANUAL (nuevo)
import { manualAssignController } from "./srv/api/controllers/manualAssign-controller.js";

// ⭐ Servicio para el CRON (auto-assign)

export default async function startServer(o = {}) {
  console.log("🚀 Iniciando servidor SAP CAP + Express...");

  try {
    console.log("🔌 Conectando a MongoDB...");
    await connectToMongo();
    console.log("✅ MongoDB ok");

    // 🔥 CORRECCIÓN CRÍTICA: Configurar CORS antes de que arranque el servidor
    // Esto asegura que CORS intercepte las peticiones OPTIONS antes que las rutas OData
    cds.on("bootstrap", (app) => {
        console.log("🛡️ Activando CORS Middleware en bootstrap...");
        app.use(cors({
            origin: [
                "https://error-hosting.vercel.app", // Tu frontend en producción
                "http://localhost:3000",            // Tu frontend local
                "http://localhost:5173"             // Vite local (por si acaso)
            ],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
            credentials: true // Permite cookies/headers de autorización
        }));
    });

    // 1️⃣ Iniciar CAP (Ahora cargará el CORS definido arriba durante el inicio)
    console.log("⚙️ Iniciando CAP...");
    const httpServer = await cds.server(o);
    const app = cds.app; // ← EXPRESS REAL
    console.log("✅ CAP activo");

    // 2️⃣ Middlewares globales adicionales (Body Parser, PWA, etc)
    // Nota: CORS ya no va aquí, ya fue cargado arriba.
    app.use(express.json({ limit: "1mb" }));
    app.use(respPWA);

    // 3️⃣ Logging
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const ms = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${
            res.statusCode
          } (${ms} ms)`
        );
      });
      next();
    });

    // 4️⃣ Healthcheck
    app.get("/health", (_, res) =>
      res.json({
        ok: true,
        service: "SAP CAP + Express",
        time: new Date().toISOString(),
      })
    );

    // 5️⃣ API normal
    app.post("/api/error/assign", manualAssignController);

    // 6️⃣ IA suggestion (tu endpoint)
    app.get("/api/error/ai-suggestion/:id", async (req, res) => {
      try {
        const { id } = req.params;
        let error;

        if (id.includes("-")) {
          // Lógica para Azure/External ID
          let responseService = await azureZterrorlogService.getError(id);
          // Verificar si responseService es string o ya objeto
          const resParsed = typeof responseService === 'string' ? JSON.parse(responseService) : responseService;
          
          if (resParsed.status && resParsed.status != 200) {
             // Manejo seguro por si el parseo o estructura varía
             return res.status(404).json({ ok: false, message: "Error no encontrado en Azure" });
          }
           // Aquí deberías asignar 'error' basado en resParsed para usarlo abajo
           // Asumo que resParsed trae la estructura del error, ajusta según tu servicio Azure
           error = resParsed.data || resParsed; 
        } else {
          // Lógica MongoDB
          error = await zterrorlog.findById(id).lean();
        }

        if (!error) {
          return res
            .status(404)
            .json({ ok: false, message: "Error no encontrado" });
        }

        const context = `
    Mensaje: ${error.ERRORMESSAGE || 'N/A'}
    Código: ${error.ERRORCODE || 'N/A'}
    Origen: ${error.ERRORSOURCE || 'N/A'}
    Módulo: ${error.MODULE || 'N/A'}
    Aplicación: ${error.APPLICATION || 'N/A'}
    
    Contexto técnico:
    ${JSON.stringify(error.CONTEXT || {}, null, 2)}
    
    Historial de sesión:
    ${(error.USER_SESSION_LOG || []).join("\n")}
        `;

        const aiRes = await getAISolution(error.ERRORMESSAGE, context);

        return res.json({ ok: true, ai: aiRes.aiResponse });
      } catch (err) {
        console.error("IA ERROR:", err);
        return res.status(500).json({ ok: false, message: err.message });
      }
    });

    // 7️⃣ Tus rutas externas
    app.use("/", iaRoute);

    // 8️⃣ Legacy redirect
    app.all("/zterrorlog/crud", (_, res) =>
      res.redirect(307, "/odata/v4/api/error/crud")
    );

    // 9️⃣ 404
    app.use((req, res) => {
      res.status(404).json({
        ok: false,
        message: `Ruta no encontrada: ${req.originalUrl}`,
      });
    });

    return httpServer;
  } catch (err) {
    console.error("❌ Error al iniciar CAP:", err);
    process.exit(1);
  }
}