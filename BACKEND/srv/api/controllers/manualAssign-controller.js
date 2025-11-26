// srv/api/controllers/manualAssign-controller.js
import ZTERRORLOG from "../models/mongodb/zterrorlog.js";

export async function manualAssignController(req, res) {
  try {
    const { errorId, assignedUser, assignedBy } = req.body;

    const error = await ZTERRORLOG.findOne({ ERRORID: errorId });

    if (!error) {
      return res.status(404).json({
        ok: false,
        message: "Error no encontrado"
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
      assignedBy
    });

  } catch (err) {
    console.error("❌ manualAssign:", err);
    return res.status(500).json({
      ok: false,
      message: "Error interno en manualAssign",
      error: err.message
    });
  }
}
