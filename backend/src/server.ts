import 'dotenv/config';
import app from './app';
import { connectDB, disconnectDB } from './db/connection';
import { syncExercisesToDb } from './db/seed';
import { invalidateExerciseCache } from './repositories/hybridExerciseRepository';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const connected = await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`BurnOut API running on port ${PORT} (db: ${connected ? 'mongo' : 'json'})`);
  });

  // El seed (1.324 upserts) va después de abrir el puerto: no debe alargar el
  // arranque en frío. Mientras corre, las rutinas salen del catálogo ya existente.
  if (connected) {
    syncExercisesToDb()
      .then(() => invalidateExerciseCache())
      .catch(error => {
        console.error('Error sincronizando ejercicios (la API sigue funcionando):', error);
      });
  }

  // Apagado limpio: en cada deploy Render manda SIGTERM; se dejan terminar las
  // peticiones en vuelo antes de cerrar la conexión a Mongo.
  const shutdown = (signal: string) => {
    console.log(`${signal} recibido — cerrando servidor`);
    server.close(async () => {
      await disconnectDB().catch(() => undefined);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
