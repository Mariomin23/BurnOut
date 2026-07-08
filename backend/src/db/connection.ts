import mongoose from 'mongoose';

/**
 * Conecta a MongoDB si MONGO_URI está definida. Nunca lanza: si falla,
 * la app sigue funcionando con el repositorio JSON (modo sin base de datos).
 */
export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI no definida — usando repositorio JSON en memoria (sin auth ni historial en nube)');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB conectado');
    return true;
  } catch (error) {
    console.error('Error conectando a MongoDB — fallback a repositorio JSON:', error);
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
