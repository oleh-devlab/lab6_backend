import { badRequest } from './errors.js';

const CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
// Express порівнює шляхи без урахування регістру, тож і тут теж.
const RESERVED_CODES = new Set(['api', 'docs', 'health']);

// Тіло має бути JSON-об'єктом лише з дозволеними полями.
// Без Content-Type: application/json express.json() тіло не розбирає,
// і req.body лишається undefined.
export function checkBody(body, allowedFields) {
  if (body === undefined) {
    throw badRequest('Request body must be JSON with Content-Type: application/json');
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }
  const extra = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (extra.length > 0) {
    throw badRequest(`Unknown field(s): ${extra.join(', ')}`);
  }
}

// Ціле число з рядка запиту в межах [min, max]; якщо параметра немає — def.
export function parseIntParam(value, name, { min, max = Infinity, def }) {
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

// Лише абсолютні http/https-адреси; javascript:, data:, file: відхиляються.
export function validateUrl(url) {
  if (url === undefined) throw badRequest('Field "url" is required');
  if (typeof url !== 'string') throw badRequest('Field "url" must be a string');
  if (url.length > 2048) throw badRequest('Field "url" must be at most 2048 characters');
  if (!/^https?:\/\//.test(url) || !URL.canParse(url)) {
    throw badRequest('Field "url" must be an absolute http or https URL');
  }
  return url;
}

export function validateAlias(alias) {
  if (typeof alias !== 'string' || !CODE_PATTERN.test(alias)) {
    throw badRequest('Field "alias" must be 3-32 characters: latin letters, digits, "-" or "_"');
  }
  if (RESERVED_CODES.has(alias.toLowerCase())) {
    throw badRequest(`Alias "${alias}" is reserved`);
  }
  return alias;
}
