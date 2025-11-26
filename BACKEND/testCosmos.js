// testCosmos.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Probando conexión con Cosmos DB...");

mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("✅ Conexión exitosa a Cosmos DB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error al conectar:", err.message);
    process.exit(1);
  });
