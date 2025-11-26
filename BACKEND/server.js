// server.js — SAP CAP + Express + MongoDB + CORS + PWA + Logging + Azure-ready
import express from 'express';
import cds from '@sap/cds';
import cors from 'cors';
import env from './srv/config/dotenvXConfig.js';
import { connectToMongo } from './srv/config/connectToMongo.js';
import respPWA from './srv/middlewares/respPWA.handler.js'; 
import { fileURLToPath } from "url";
import path from "path";
import iaRoute from "./srv/api/routes/ia-route.js";

// ⭐ AUTO-ASIGNACIÓN (automático)
import { autoAssignController } from "./srv/api/controllers/autoAssign-controller.js";

// ⭐ ASIGNACIÓN MANUAL (nuevo)
import { manualAssignController } from "./srv/api/controllers/manualAssign-controller.js";

// ⭐ Servicio para el CRON (auto-assign)
import { runAutoAssign } from "./srv/api/services/autoAssign-service.js";

const app = cds.server;

export default async function startServer(o = {}) {
  console.log('🚀 Iniciando servidor SAP CAP + Express...');

  try {
    // 1️⃣ Conexión a Mongo
    console.log('🔌 Conectando a MongoDB...');
    await connectToMongo();
    console.log('✅ MongoDB ok');

    // 2️⃣ Configuración de Express
    const app = express();
    app.express = express;

    const isProd = env.NODE_ENV === 'production';
    app.use(cors({ origin: isProd ? '*' : 'http://localhost:5173' }));
    app.use(express.json({ limit: '1mb' }));
    app.use(respPWA);

    // --- Logging middleware ---
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`
        );
      });
      next();
    });

    // Healthcheck
    app.get('/health', (_, res) =>
      res.json({ ok: true, service: 'SAP CAP + Express', time: new Date().toISOString() })
    );

    // ⭐ RUTAS DEL SISTEMA DE ASIGNACIÓN

    // 🔥 AUTO-ASIGNACIÓN (la original, automática)
    app.post("/api/error/autoAssign", autoAssignController);

    // 🔥 ASIGNACIÓN MANUAL (nuevo)
    app.post("/api/error/assign", manualAssignController);

    // 3️⃣ Inyectar Express en CAP
    o.app = app;

    // 4️⃣ Iniciar CAP
    console.log('⚙️ Iniciando CAP...');
    const httpServer = await cds.server(o);
    o.app.httpServer = httpServer;
    console.log('✅ CAP activo');

    // ⭐ CRON (ejecuta auto-assign cada 5 minutos)
    const THREE_MINUTES = 3 * 60 * 1000;
    setInterval(async () => {
      try {
        const result = await runAutoAssign();
        console.log(
          `🤖 [AutoAssign CRON] ${new Date().toISOString()} → escaneados: ${result.scanned}, actualizados: ${result.updated}`
        );
      } catch (err) {
        console.error("❌ [AutoAssign CRON] Error:", err.message);
      }
    }, THREE_MINUTES);

    // 5️⃣ Rutas REST personalizadas (opcional)
    // const { router: ztRouter } = await import('./srv/api/routes/zterrorlog-service.js');
    // app.use('/api/v1/zterrorlog', ztRouter);

    // 6️⃣ Compatibilidad con el FrontEnd actual
    app.all('/zterrorlog/crud', (_, res) =>
      res.redirect(307, '/odata/v4/api/error/crud')
    );

    app.use("/api/error", iaRoute);

    // 7️⃣ Middleware de 404
    app.use((req, res) => {
      res.status(404).json({
        ok: false,
        message: `Ruta no encontrada: ${req.originalUrl}`,
      });
    });

    // 8️⃣ Global error handler
    app.use((err, req, res, next) => {
      console.error('💥 Error interno:', err);
      res.status(500).json({
        ok: false,
        message: 'Error interno del servidor',
        details: err.message,
      });
    });

    // Log final
    const PORT = env.PORT || cds.env.port || 3333;
    console.log(`✅ Servidor CAP+Express en http://localhost:${PORT}`);
    console.log(`   OData ➜ http://localhost:${PORT}/odata/v4/`);
    console.log(`   Health ➜ http://localhost:${PORT}/health`);

    return httpServer;
  } catch (err) {
    console.error('❌ Error al iniciar CAP:', err);
    process.exit(1);
  }
}

// Autoejecución si se lanza directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  console.log("🧩 Ejecutando startServer() automáticamente...");
  startServer().catch((err) => {
    console.error("💥 Error al iniciar servidor:", err);
    process.exit(1);
  });
}
