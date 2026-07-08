import 'dotenv/config';
import { connectDB, disconnectDB } from '../db/connection';
import { syncExercisesToDb } from '../db/seed';

async function main() {
  const connected = await connectDB();
  if (!connected) {
    console.error('No se pudo conectar a MongoDB. Define MONGO_URI en backend/.env');
    process.exit(1);
  }
  await syncExercisesToDb();
  await disconnectDB();
}

main();
