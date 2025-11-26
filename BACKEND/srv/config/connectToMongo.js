// srv/config/connectToMongo.js
import mongoose from 'mongoose';
import env from './dotenvXConfig.js';

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
    if (!uri || uri.includes('no encontré')) {
      throw new Error('❌ CONNECTION_STRING no definida en el archivo .env');
    }

    const db = await mongoose.connect(uri, {});
    console.log(`✅ Conectado a MongoDB → ${db.connection.name}`);
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1); // Detiene la app si la conexión falla
  }
}
