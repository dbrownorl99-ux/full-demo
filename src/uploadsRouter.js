// src/uploadsRouter.js
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

// Persistent disk
const DATA_DIR = process.env.DATA_DIR || '/data';
const UPLOADS_ROOT = path.join(DATA_DIR, 'uploads');

const router = Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { slug } = req.params;
      if (!slug) return cb(new Error('Missing slug in URL'));
      const dir = path.join(UPLOADS_ROOT, slug);
      await fsp.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage });

// Expect fields: dl, registration, insurance, income, other (multiple allowed for "other")
const fields = [
  { name: 'dl', maxCount: 1 },
  { name: 'registration', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'income', maxCount: 1 },
  { name: 'other', maxCount: 10 },
];

// POST /api/upload/:slug
router.post('/:slug', upload.fields(fields), async (req, res) => {
  try {
    const { slug } = req.params;
    const { applicationId, customerName } = req.body || {};
    if (!slug) return res.status(400).json({ ok: false, error: 'Missing slug' });

    // Persist a small manifest next to files
    const manifestPath = path.join(UPLOADS_ROOT, slug, 'manifest.json');
    const payload = {
      slug,
      applicationId: applicationId || null,
      customerName: customerName || null,
      receivedAt: new Date().toISOString(),
      files: Object.fromEntries(Object.entries(req.files || {}).map(([k, arr]) => [k, arr.map(f => f.filename)]))
    };
    await fsp.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf8');

    res.json({ ok: true, received: payload.files });
  } catch (e) {
    console.error('UPLOAD FAILED', e);
    res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

export default router;
