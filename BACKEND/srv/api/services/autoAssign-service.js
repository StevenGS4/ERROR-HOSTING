// srv/api/services/autoAssign-service.js
import axios from "axios";
import ZTERRORLOG from "../models/mongodb/zterrorlog.js";

// ============================
//  ENDPOINTS OFICIALES
// ============================
const USER_GETALL =
  "http://localhost:3333/api/users/crud?ProcessType=getAll&DBServer=MongoDB&LoggedUser=TEST";

const USER_GETBYID =
  "http://localhost:3333/api/users/crud?ProcessType=getById&DBServer=MongoDB&LoggedUser=TEST";

// ============================
//  REGLAS DE ROLES POR MÓDULO
// ============================
const MODULE_ROLES = {
  PRODUCTOS: ["dev.productos", "jefe.productos"],
  MEDICINA: ["dev.medicina", "jefe.medicina"],
  ALMACEN: ["dev.almacen", "jefe.almacen"],
  FINANZAS: ["dev.finanzas", "jefe.finanzas"],
  ERP: ["dev.erp", "jefe.erp"],
  SISTEMAS: ["dev.sistemas", "jefe.sistemas"],
};

// ============================
//  AUTO ASSIGNER
// ============================
export async function runAutoAssign() {
  try {
    console.log("\n\n================ AUTOASSIGN LOG ================");

    // 0️⃣ Obtener errores NEW sin usuarios asignados
    const errors = await ZTERRORLOG.find({
      STATUS: "NEW",
      CANSEEUSERS: { $size: 0 }
    });

    console.log("🔎 Errores encontrados:", errors.length);

    if (!errors.length) {
      return { ok: true, scanned: 0, updated: 0 };
    }

    // 1️⃣ Obtener lista base de usuarios
    console.log("⏳ Consultando lista de usuarios...");
    const resAll = await axios.post(USER_GETALL, { usuario: {} });

    const allUsers =
      resAll?.data?.value?.[0]?.data?.[0]?.dataRes || [];

    console.log("👥 Usuarios obtenidos realmente:", allUsers.length);
    console.log("IDs:", allUsers.map(u => u.USERID));

    // =============================
    // 2️⃣ Obtener ROLES reales por usuario
    // =============================
    const finalUsers = [];

    for (const u of allUsers) {
      console.log("➡ Consultando roles de:", u.USERID);

      const detail = await axios.post(USER_GETBYID, {
        usuario: { USERID: u.USERID }
      });

      const userReal =
        detail?.data?.value?.[0]?.data?.[0]?.dataRes;

      if (!userReal) {
        console.log("⛔ Usuario no encontrado:", u.USERID);
        continue;
      }

      console.log("   ✔ Roles:", userReal.ROLES);

      finalUsers.push(userReal);
    }

    console.log("\n📌 Usuarios con roles REALES:", finalUsers.length);

    // =============================
    // 3️⃣ Asignación automática
    // =============================
    let updated = 0;
    const updates = [];

    for (const err of errors) {
      console.log("\n--------------------------------------");
      console.log("🆔 ERRORID:", err.ERRORID);
      console.log("📦 MODULE:", err.MODULE);

      const expected = MODULE_ROLES[err.MODULE];
      console.log("🎯 Roles esperados:", expected);

      if (!expected) {
        console.log("⛔ No hay reglas para este módulo:", err.MODULE);
        continue;
      }

      const validUsers = finalUsers.filter((u) =>
        u.ROLES?.some((r) => expected.includes(r.ROLEID))
      );

      console.log("👤 Usuarios válidos:", validUsers.map(u => u.USERID));

      const ids = validUsers.map(u => u.USERID);

      if (!ids.length) {
        console.log("⛔ Ningún usuario coincide con roles válidos");
        continue;
      }

      // Guardar cambios
      err.CANSEEUSERS = ids;
      await err.save();

      updates.push({
        errorId: err.ERRORID,
        module: err.MODULE,
        CANSEEUSERS: ids
      });

      updated++;
      console.log("✅ Asignado a:", ids);
    }

    console.log("\n========= RESULTADO FINAL =========");
    console.log("Escaneados:", errors.length);
    console.log("Actualizados:", updated);
    console.log("===================================\n");

    return {
      ok: true,
      scanned: errors.length,
      updated,
      updates
    };

  } catch (err) {
    console.error("❌ AutoAssign:", err);
    return { ok: false, error: err.message };
  }
}
