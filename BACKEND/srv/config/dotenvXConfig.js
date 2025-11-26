// srv/config/dotenvXConfig.js
import dotenv from 'dotenv';
dotenv.config();


const requiredVars = [
  'HOST',
  'PORT',
  'API_URL',
  'CONNECTION_STRING'
];

// Variables opcionales
const optionalVars = [
  'GEMINI_API_KEY'
];

// Carga centralizada del entorno
const env = {
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  API_URL: process.env.API_URL,
  CONNECTION_STRING: process.env.CONNECTION_STRING,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validar las requeridas
for (const key of requiredVars) {
  if (!env[key]) console.warn(`⚠️  Falta variable de entorno requerida: ${key}`);
}

// Notificar si alguna opcional falta (no es error)
for (const key of optionalVars) {
  if (!env[key]) console.log(`ℹ️  Variable opcional no definida: ${key}`);
}

export default env;
