// src/linksRouter.js
import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const router = Router();

// Use Render persistent disk if present
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
  await fsp.rename(tmp, FILE_PATH);
}

function slugify(s) {
  return (s || '')
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
  while (existingSet.has(slug)) slug = `${baseSlug}-${i++}`;
  return slug;
}

// POST /api/links  -> { ok, slug, url }
router.post('/', async (req, res) => {
  try {
    const { name = '', appId = '' } = req.body || {};
    if (!name || !appId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: name and appId' });
    }
    const store = await loadAll();
    const existing = new Set(store.links.map(l => l.slug));
    const slug = makeSlug(`${name}-${appId}`, existing);
    const record = { slug, name, appId, createdAt: new Date().toISOString() };
    store.links.push(record);
    await saveAll(store);

    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const url = `${base || ''}/u/${slug}`;

    return res.json({ ok: true, slug, url });
  } catch (e) {
    console.error('CREATE LINK FAILED', e);
    return res.status(500).json({ ok: false, error: 'Server failed to create link. Is /data writable?' });
  }
});

// GET /api/links/:slug -> { ok, link }
router.get('/:slug', async (req, res) => {
  try {
    const store = await loadAll();
    const link = store.links.find(l => l.slug === req.params.slug);
    if (!link) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, link });
  } catch (e) {
    console.error('FETCH LINK FAILED', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Optional: GET /api/links -> list
router.get('/', async (_req, res) => {
  try {
    const store = await loadAll();
    res.json({ ok: true, links: store.links });
  } catch (e) {
    console.error('LIST LINKS FAILED', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
