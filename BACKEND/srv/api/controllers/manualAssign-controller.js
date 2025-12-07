// srv/api/controllers/manualAssign-controller.js
import ZTERRORLOG from "../models/mongodb/zterrorlog.js";
import azureService from "../services/azure-zterrorlog-service.js"; // Asegúrate de que la ruta sea correcta

export async function manualAssignController(req, res) {
  try {
    const { errorId, assignedUser, assignedBy } = req.body;

    // Obtenemos el flag del servidor (default a mongo si no viene)
    const dbServer = req.query.dbServer || req.body.dbServer || "mongo";

    // ==========================================
    // 🟦 CASO AZURE
    // ==========================================
    if (dbServer === "azure") {
      // 1. Verificar existencia (opcional, pero buena práctica para dar 404 real)
      // Nota: errorId aquí actúa como rowKey
      const checkRaw = await azureService.getError(errorId);
      const checkData = JSON.parse(checkRaw);

      if (checkData.status === 404) {
        return res.status(404).json({
          ok: false,
          message: "Error no encontrado en Azure",
        });
      }

      // 2. Preparar payload de actualización
      // Tu servicio 'updateError' ya maneja el JSON.stringify de ASIGNEDUSERS internamente
      const updatePayload = {
        rowKey: errorId,
        ASIGNEDUSERS: [assignedUser],
        STATUS: "IN_PROGRESS",
      };

      // 3. Ejecutar actualización
      const updateRaw = await azureService.updateError(updatePayload);
      const updateResponse = JSON.parse(updateRaw);

      if (updateResponse.status === 200) {
        return res.json({
          ok: true,
          message: "Usuario asignado exitosamente (Azure)",
          assignedTo: assignedUser,
          assignedBy,
        });
      } else {
        throw new Error(
          updateResponse.message || "Fallo al actualizar en Azure"
        );
      }
    }

    // ==========================================
    // 🍃 CASO MONGO (Original)
    // ==========================================
    else {
      const error = await ZTERRORLOG.findOne({ ERRORID: errorId }); // Ojo: Si usas _id nativo, cambia a findById(errorId)

      if (!error) {
        return res.status(404).json({
          ok: false,
          message: "Error no encontrado",
        });
      }

      // Asignación manual: SOLO ASIGNEDUSERS
      error.ASIGNEDUSERS = [assignedUser];
      error.STATUS = "IN_PROGRESS";

      await error.save();

      return res.json({
        ok: true,
        message: "Usuario asignado exitosamente",
        assignedTo: assignedUser,
        assignedBy,
      });
    }
  } catch (err) {
    console.error("❌ manualAssign:", err);
    return res.status(500).json({
      ok: false,
      message: "Error interno en manualAssign",
      error: err.message,
    });
  }
}
