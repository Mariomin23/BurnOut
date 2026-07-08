import 'dotenv/config';
import app from './app';
import { connectDB } from './db/connection';
import { syncExercisesToDb } from './db/seed';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const connected = await connectDB();
  if (connected) {
    try {
      await syncExercisesToDb();
    } catch (error) {
      console.error('Error sincronizando ejercicios (la API sigue funcionando):', error);
    }
  }

  app.listen(PORT, () => {
    console.log(`BurnOut API running on port ${PORT} (db: ${connected ? 'mongo' : 'json'})`);
  });
}

bootstrap();
