import express from 'express';
import { notFound } from '../errors.js';
import * as linksRepo from '../repositories/links.js';

const router = express.Router();

// 302 браузер не кешує: кожен перехід доходить до сервера і рахується.
router.get('/:code', async (req, res) => {
  const url = await linksRepo.incrementClicks(req.params.code);
  if (!url) throw notFound(`Link "${req.params.code}" not found`);
  res.redirect(302, url);
});

export default router;
