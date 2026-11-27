import express from 'express';
import { db } from '../db.js';
import { notFound } from '../errors.js';

const router = express.Router();

// GET /:code — перехід за коротким посиланням.
// Лічильник збільшується тим самим запитом, що й читає адресу:
// UPDATE ... SET clicks = clicks + 1 атомарний, тож одночасні переходи
// не загубляться.
router.get('/:code', async (req, res) => {
  const row = await db.oneOrNone(
    'UPDATE links SET clicks = clicks + 1 WHERE code = $1 RETURNING original_url',
    [req.params.code],
  );
  if (!row) throw notFound(`Link "${req.params.code}" not found`);

  // 302 браузер не кешує: кожен перехід доходить до сервера і рахується.
  res.redirect(302, row.original_url);
});

export default router;
