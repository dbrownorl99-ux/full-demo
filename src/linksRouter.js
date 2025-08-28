// src/linksRouter.js
import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const router = Router();

// Use Render disk if present; fallback to local "data"
const DATA_DIR = process.env.DATA_DIR || '/data';
const FILE_PATH = path.join(DATA_DIR, 'links.json');

async function ensureStore() {
  await fsp.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  try {
    await fsp.access(FILE_PATH, fs.constants.F_OK);
  } catch {
    await fsp.writeFile(FILE_PATH, JSON.stringify({ links: [] }, null, 2), 'utf8');
  }
}

async function loadAll() {
  await ensureStore();
  const buf = await fsp.readFile(FILE_PATH, 'utf8');
  return JSON.parse(buf || '{"links": []}');
}

async function saveAll(data) {
  const tmp = FILE_PATH + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fsp.rename(tmp, FILE_PATH); // atomic-ish write
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function makeSlug(base, existingSet) {
  let baseSlug = slugify(base || 'customer');
  if (!baseSlug) baseSlug = 'link';
  let slug = baseSlug;
  let i = 2;
  while (existingSet.has(slug)) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

/**
 * POST /api/links
 * Body: { name, appId, phone, email, rate, payment, term, docs }
 * Returns: { ok, slug, url }
 */
router.post('/', async (req, res) => {
  try {
    const {
      name = '',
      appId = '',
      phone = '',
      email = '',
      rate = '',
      payment = '',
      term = '',
      docs = '',
    } = req.body || {};

    if (!appId || !name) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: name and appId' });
    }

    const store = await loadAll();
    const existing = new Set(store.links.map((l) => l.slug));
    const slug = makeSlug(`${name}-${appId}`, existing);

    const record = {
      slug,
      name,
      appId,
      phone,
      email,
      rate,
      payment,
      term,
      docs,
      createdAt: new Date().toISOString(),
    };

    store.links.push(record);
    await saveAll(store);

    const baseUrl = process.env.PUBLIC_BASE_URL || ''; // e.g., https://yourapp.onrender.com
    const url = `${baseUrl}/u/${slug}`.replace(/^(https?:\/\/)?\/\//, 'https://'); // be safe

    return res.json({ ok: true, slug, url });
  } catch (err) {
    console.error('CREATE LINK FAILED:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server failed to create link. Ensure /data is mounted & writable.',
    });
  }
});

/**
 * GET /api/links/:slug
 * Returns the record for a slug (used by upload page).
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await loadAll();
    const item = store.links.find((l) => l.slug === slug);
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.json({ ok: true, link: item });
  } catch (err) {
    console.error('FETCH LINK FAILED:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/**
 * GET /api/links
 * Optional admin list.
 */
router.get('/', async (_req, res) => {
  try {
    const store = await loadAll();
    res.json({ ok: true, links: store.links });
  } catch (err) {
    console.error('LIST LINKS FAILED:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
