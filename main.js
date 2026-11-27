// Завантажує змінні з .env у process.env (при запуску без Docker).
// У контейнері їх передає env_file з compose.yaml.
import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { db, pgp } from './db.js';
import { errorHandler, notFoundHandler } from './errors.js';

const app = express();
const PORT = Number(process.env.NODE_DOCKER_PORT ?? 8080);

const spec = YAML.parse(fs.readFileSync('./openapi.yaml', 'utf8'));

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

// Перевірка стану: чи живий сервер і чи відповідає база.
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

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
