// Завантажує змінні з .env у process.env (при запуску без Docker).
// У контейнері їх передає env_file з compose.yaml.
import 'dotenv/config';
import app from './app.js';
import { pgp } from './db.js';

const PORT = Number(process.env.NODE_DOCKER_PORT ?? 8080);

const server = app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`Server listening on port ${PORT}`);
});

function shutdown() {
  server.close(() => {
    pgp.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
