import { db } from '../db.js';

const COLUMNS = 'code, original_url, created_at, clicks';

export function findAll(limit, offset) {
  return db.any(
    `SELECT ${COLUMNS} FROM links
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
}

export function findByCode(code) {
  return db.oneOrNone(`SELECT ${COLUMNS} FROM links WHERE code = $1`, [code]);
}

// Повертає null, якщо код уже зайнятий: UNIQUE у базі гарантує
// унікальність навіть при одночасних запитах.
export function insert(code, url) {
  return db.oneOrNone(
    `INSERT INTO links (code, original_url) VALUES ($1, $2)
     ON CONFLICT (code) DO NOTHING
     RETURNING ${COLUMNS}`,
    [code, url],
  );
}

export function updateUrl(code, url) {
  return db.oneOrNone(
    `UPDATE links SET original_url = $1 WHERE code = $2 RETURNING ${COLUMNS}`,
    [url, code],
  );
}

export async function remove(code) {
  const { rowCount } = await db.result('DELETE FROM links WHERE code = $1', [code]);
  return rowCount > 0;
}

// Атомарно збільшує лічильник і повертає цільову адресу (або null).
export async function incrementClicks(code) {
  const row = await db.oneOrNone(
    'UPDATE links SET clicks = clicks + 1 WHERE code = $1 RETURNING original_url',
    [code],
  );
  return row?.original_url ?? null;
}
