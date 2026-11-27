import crypto from 'node:crypto';
import express from 'express';
import { conflict, notFound } from '../errors.js';
import * as linksRepo from '../repositories/links.js';
import { checkBody, parseIntParam, validateAlias, validateUrl } from '../validation.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const GENERATED_LENGTH = 7;
const MAX_GENERATE_ATTEMPTS = 5;

// Рядок таблиці -> об'єкт Link зі специфікації.
function toLink(row, req) {
  return {
    code: row.code,
    url: row.original_url,
    shortUrl: `${req.protocol}://${req.get('host')}/${row.code}`,
    createdAt: row.created_at.toISOString(),
    clicks: row.clicks,
  };
}

function generateCode() {
  let code = '';
  for (let i = 0; i < GENERATED_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

const linkNotFound = (code) => notFound(`Link "${code}" not found`);

async function listLinks(req, res) {
  const limit = parseIntParam(req.query.limit, 'limit', { min: 1, max: 100, def: 20 });
  const offset = parseIntParam(req.query.offset, 'offset', { min: 0, def: 0 });
  const rows = await linksRepo.findAll(limit, offset);
  res.json(rows.map((row) => toLink(row, req)));
}

async function createLink(req, res) {
  checkBody(req.body, ['url', 'alias']);
  const url = validateUrl(req.body.url);
  let row;

  if (req.body.alias !== undefined) {
    const alias = validateAlias(req.body.alias);
    row = await linksRepo.insert(alias, url);
    if (!row) throw conflict(`Alias "${alias}" is already taken`);
  } else {
    // Згенерований код міг випадково збігтися з наявним — пробуємо інший.
    for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS && !row; attempt++) {
      row = await linksRepo.insert(generateCode(), url);
    }
    if (!row) throw new Error('Failed to generate a unique code');
  }

  res
    .status(201)
    .location(`/api/links/${row.code}`)
    .json(toLink(row, req));
}

async function getLink(req, res) {
  const row = await linksRepo.findByCode(req.params.code);
  if (!row) throw linkNotFound(req.params.code);
  res.json(toLink(row, req));
}

async function updateLink(req, res) {
  checkBody(req.body, ['url']);
  const url = validateUrl(req.body.url);
  const row = await linksRepo.updateUrl(req.params.code, url);
  if (!row) throw linkNotFound(req.params.code);
  res.json(toLink(row, req));
}

async function deleteLink(req, res) {
  if (!(await linksRepo.remove(req.params.code))) throw linkNotFound(req.params.code);
  res.sendStatus(204);
}

const router = express.Router();

router.route('/')
  .get(listLinks)
  .post(createLink);

router.route('/:code')
  .get(getLink)
  .patch(updateLink)
  .delete(deleteLink);

export default router;
