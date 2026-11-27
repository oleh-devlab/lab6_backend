import express from 'express';
import { db } from './db.js';
import { errorHandler, notFoundHandler } from './errors.js';
import logger from './middleware/logger.js';
import linksRouter from './routes/links.js';
import redirectRouter from './routes/redirect.js';
import docsRouter from './swagger.js';

const app = express();

app.use(logger);
app.use(express.json());

app.use('/docs', docsRouter);

// Перевірка стану: чи живий сервер і чи відповідає база.
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use('/api/links', linksRouter);

// Після /docs, /health і /api, інакше /:code перехоплював би ці шляхи.
app.use('/', redirectRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
