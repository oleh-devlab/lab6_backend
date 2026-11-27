// Завантажує змінні з .env у process.env (при запуску без Docker).
// У контейнері їх передає env_file з compose.yaml.
import 'dotenv/config';
import express from 'express';
import { db, pgp } from './db.js';

const app = express();
const PORT = Number(process.env.NODE_DOCKER_PORT ?? 8080);

app.use(express.json());

// Перевірка стану: чи живий сервер і чи відповідає база.
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// docker compose down надсилає SIGTERM. Без обробника Node у контейнері
// його ігнорує, і Docker чекає 10 с, перш ніж зупинити процес примусово.
function shutdown() {
  server.close(() => {
    pgp.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
