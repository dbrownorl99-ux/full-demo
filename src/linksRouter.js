// src/linksRouter.js
import fs from 'fs';
import path from 'path';
import express from 'express';

const router = express.Router();
// always resolve to the repo root /data/links.json, not src/
const DATA_FILE = path.join(process.cwd(), 'data', 'links.json');

function readLinks() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeLinks(links) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(links, null, 2), 'utf8');
}
function slugify(s){return String(s||'link').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);}
function makeId(n=10){const a='23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';let o='';for(let i=0;i<n;i++)o+=a[Math.floor(Math.random()*a.length)];return o;}

router.post('/', (req, res) => {
  const { appId, name } = req.body || {};
  if (!appId || !name) return res.status(400).json({ error: 'appId and name are required' });
  const links = readLinks();
  const id = makeId();
  const slug = `${slugify(name)}-${id}`;
  const createdAt = new Date().toISOString();
  const link = { id, slug, appId: String(appId), name: String(name), createdAt };
  links.push(link); writeLinks(links);
  res.json({ link });
});

router.get('/', (req, res) => {
  const q = String(req.query?.q || '').toLowerCase();
  const links = readLinks();
  const filtered = q
    ? links.filter(l => l.name.toLowerCase().includes(q) || l.appId.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q))
    : links;
  filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  res.json({ links: filtered });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const links = readLinks();
  const idx = links.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = links.splice(idx, 1);
  writeLinks(links);
  res.json({ ok: true, removed });
});

export default router;
