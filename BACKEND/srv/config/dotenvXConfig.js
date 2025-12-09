// srv/config/dotenvXConfig.js
import dotenv from "dotenv";
dotenv.config();

export default {
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  API_URL: process.env.API_URL,
  CONNECTION_STRING: process.env.CONNECTION_STRING,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  NODE_ENV: process.env.NODE_ENV || "development",
  AZURE_STRING: process.env.AZURE_STRING,
  DOMINIO_USUARIOS: process.env.DOMINIO_USUARIOS,
  SEND_NOTIFICATIONS: process.env.SEND_NOTIFICATIONS,
  DOMINIO_NOTIS: process.env.DOMINIO_NOTIS,
  FRONTEND_DOMINIO: process.env.FRONTEND_DOMINIO,
};
