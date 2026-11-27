import crypto from 'node:crypto';
import express from 'express';
import { db } from '../db.js';
import { badRequest, notFound, HttpError } from '../errors.js';

const router = express.Router();

// Поля, які повертаються в кожній відповіді з посиланням.
const LINK_COLUMNS = 'code, original_url, created_at, clicks';

const CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

const RESERVED_CODES = new Set(['api', 'docs', 'health']);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const GENERATED_LENGTH = 7;
const MAX_GENERATE_ATTEMPTS = 5;

// Код помилки PostgreSQL при порушенні UNIQUE.
const UNIQUE_VIOLATION = '23505';

// ---------- Допоміжні функції ----------

// Рядок таблиці -> об'єкт Link зі специфікації.
// shortUrl будується з адреси, за якою прийшов запит (напр. localhost:8080).
function toLink(row, req) {
  return {
    code: row.code,
    url: row.original_url,
    shortUrl: `${req.protocol}://${req.get('host')}/${row.code}`,
    createdAt: row.created_at.toISOString(),
    clicks: row.clicks,
  };
}

// Ціле число з рядка запиту в межах [min, max]; якщо параметра немає — def.
function parseIntParam(value, name, { min, max = Infinity, def }) {
  if (value === undefined) return def;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw badRequest(`Query parameter "${name}" must be an integer`);
  }
  const n = Number(value);
  if (n < min || n > max) {
    const range = max === Infinity ? `>= ${min}` : `between ${min} and ${max}`;
    throw badRequest(`Query parameter "${name}" must be ${range}`);
  }
  return n;
}

// Тіло має бути JSON-об'єктом лише з дозволеними полями.
// Без Content-Type: application/json express.json() не розбирає тіло,
// і req.body лишається undefined.
function checkBody(body, allowed) {
  if (body === undefined) {
    throw badRequest('Request body must be JSON with Content-Type: application/json');
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }
  const extra = Object.keys(body).filter((key) => !allowed.includes(key));
  if (extra.length > 0) {
    throw badRequest(`Unknown field(s): ${extra.join(', ')}`);
  }
}

function validateUrl(url) {
  if (url === undefined) throw badRequest('Field "url" is required');
  if (typeof url !== 'string') throw badRequest('Field "url" must be a string');
  if (url.length > 2048) throw badRequest('Field "url" must be at most 2048 characters');
  if (!/^https?:\/\//.test(url) || !URL.canParse(url)) {
    throw badRequest('Field "url" must be an absolute http or https URL');
  }
  return url;
}

function validateAlias(alias) {
  if (typeof alias !== 'string' || !CODE_PATTERN.test(alias)) {
    throw badRequest(
      'Field "alias" must be 3-32 characters: latin letters, digits, "-" or "_"',
    );
  }
  if (RESERVED_CODES.has(alias.toLowerCase())) {
    throw badRequest(`Alias "${alias}" is reserved`);
  }
  return alias;
}

function generateCode() {
  let code = '';
  for (let i = 0; i < GENERATED_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

function insertLink(code, url) {
  return db.one(
    `INSERT INTO links (code, original_url) VALUES ($1, $2) RETURNING ${LINK_COLUMNS}`,
    [code, url],
  );
}

// ---------- Маршрути ----------

// POST /api/links — створити посилання.
router.post('/', async (req, res) => {
  checkBody(req.body, ['url', 'alias']);
  const url = validateUrl(req.body.url);
  let row;

  if (req.body.alias !== undefined) {
    const alias = validateAlias(req.body.alias);
    try {
      row = await insertLink(alias, url);
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new HttpError(409, 'ALIAS_TAKEN', `Alias "${alias}" is already taken`);
      }
      throw err;
    }
  } else {
    // Унікальність гарантує UNIQUE у базі
    for (let attempt = 1; !row; attempt++) {
      try {
        row = await insertLink(generateCode(), url);
      } catch (err) {
        if (err.code !== UNIQUE_VIOLATION || attempt === MAX_GENERATE_ATTEMPTS) throw err;
      }
    }
  }

  res
    .status(201)
    .location(`/api/links/${row.code}`)
    .json(toLink(row, req));
});

// GET /api/links — перелік, від найновішого.
router.get('/', async (req, res) => {
  const limit = parseIntParam(req.query.limit, 'limit', { min: 1, max: 100, def: 20 });
  const offset = parseIntParam(req.query.offset, 'offset', { min: 0, def: 0 });

  const rows = await db.any(
    `SELECT ${LINK_COLUMNS} FROM links
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  res.json(rows.map((row) => toLink(row, req)));
});

// GET /api/links/:code — одне посилання.
router.get('/:code', async (req, res) => {
  const row = await db.oneOrNone(
    `SELECT ${LINK_COLUMNS} FROM links WHERE code = $1`,
    [req.params.code],
  );
  if (!row) throw notFound(`Link "${req.params.code}" not found`);
  res.json(toLink(row, req));
});

// PATCH /api/links/:code — змінити лише цільову адресу.
router.patch('/:code', async (req, res) => {
  checkBody(req.body, ['url']);
  const url = validateUrl(req.body.url);

  const row = await db.oneOrNone(
    `UPDATE links SET original_url = $1 WHERE code = $2 RETURNING ${LINK_COLUMNS}`,
    [url, req.params.code],
  );
  if (!row) throw notFound(`Link "${req.params.code}" not found`);
  res.json(toLink(row, req));
});

// DELETE /api/links/:code — видалити посилання.
router.delete('/:code', async (req, res) => {
  const { rowCount } = await db.result('DELETE FROM links WHERE code = $1', [
    req.params.code,
  ]);
  if (rowCount === 0) throw notFound(`Link "${req.params.code}" not found`);
  res.status(204).end();
});

export default router;
