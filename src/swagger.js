import fs from 'node:fs';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

// Специфікація читається з файлу під час запуску й у коді не дублюється.
const spec = YAML.parse(
  fs.readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'),
);

const router = express.Router();
router.use(swaggerUi.serve, swaggerUi.setup(spec));

export default router;
