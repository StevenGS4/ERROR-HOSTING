// srv/config/connectToMongo.js
import mongoose from "mongoose";
import os from "os";
import env from "./dotenvXConfig.js";
import { sendSystemNotification } from "../helpers/sendSystemNotification.js";
import dotenvXConfig from "./dotenvXConfig.js";

/**
 * Conecta a MongoDB usando mongoose y las variables del entorno.
 *
 * Uso:
 *   import { connectToMongo } from './srv/config/connectToMongo.js';
 *   await connectToMongo();
 */

export async function connectToMongo() {
  try {
    const uri = env.CONNECTION_STRING;
    if (!uri || uri.includes("no encontré")) {
      throw new Error("❌ CONNECTION_STRING no definida en el archivo .env");
    }

    const db = await mongoose.connect(uri, {});
    console.log(`✅ Conectado a MongoDB → ${db.connection.name}`);
  } catch (err) {
    //MANDAR NOTI

    const newError = {
      data: {
        ERRORMESSAGE: "ERROR AL CONECTAR CON MONGODB",
        ERRORCODE: "ERR-500",
        ERRORSOURCE: "BACKEND",
        TYPE_ERROR: "DATABASE",
        CONTEXT: [
          {
            stack: err,
          },
        ],
        SEVERITY: "ERROR",
        MODULE: "errores",
        APPLICATION: "ERRORES BACKEND",
      },
    };

    const { MODULE } = newError.data;

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
    newError.data.CANSEEUSERS = filtrados;
    console.log("===========================================================");
    console.log(newError.data.CANSEEUSERS);

    await sendSystemNotification(newError);

    console.error("❌ Error al conectar con MongoDB:", err.message);
    process.exit(1); // Detiene la app si la conexión falla
  }
}
