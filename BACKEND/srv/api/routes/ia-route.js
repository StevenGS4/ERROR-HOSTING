import express from "express";
import { getAISolution } from "../services/ai-service.js";
import zterrorlog from "../models/mongodb/zterrorlog.js";

const router = express.Router();

router.get("/ai-suggestion/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const error = await zterrorlog.findById(id).lean();
    if (!error) {
      return res.status(404).json({ ok: false, message: "Error no encontrado" });
    }

    const context = `
Mensaje: ${error.ERRORMESSAGE}
Código: ${error.ERRORCODE}
Origen: ${error.ERRORSOURCE}
Módulo: ${error.MODULE}
Aplicación: ${error.APPLICATION}

Contexto técnico:
${JSON.stringify(error.CONTEXT, null, 2)}

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

export default router;
