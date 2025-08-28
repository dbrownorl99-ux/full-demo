// src/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// If you created the router from my previous message:
import linksRouter from './linksRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust this if your public folder is elsewhere:
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------- App & Middleware -------------------- */

// Render runs behind a proxy; this helps if you ever look at req.ip, etc.
app.set('trust proxy', 1);

// Parse JSON & forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow your site origin (set ALLOWED_ORIGIN in Render env)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? true : [allowedOrigin],
    credentials: false,
  })
);

// Serve static assets, but DO NOT auto-serve index.html at "/"
app.use(express.static(publicDir, { index: false }));

/* -------------------- Health -------------------- */

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

/* -------------------- API Routes -------------------- */

// Link management API (persistent JSON store in /data via linksRouter)
app.use('/api/links', linksRouter);

/* -------------------- Web Routes -------------------- */

// Homepage → Page Generator
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'generate.html'));
});

// Optional admin dashboard (if you have public/admin.html)
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

/**
 * Customer upload page (Document Upload) — only reachable via generated links.
 * If your old server built a redirect like /index.html?appId=...&name=...,
 * you can look up the slug using the links API/store and res.redirect here.
 * For most setups, serving index.html and letting client-side JS fetch by slug is perfect.
 */
app.get('/u/:slug', (req, res) => {
  // Example of optional server-side redirect:
  // const slug = req.params.slug;
  // const record = await findBySlug(slug); // your lookup
  // if (!record) return res.status(404).send('Link not found');
  // return res.redirect(`/index.html?appId=${encodeURIComponent(record.appId)}&name=${encodeURIComponent(record.name)}`);
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Optional direct path to the upload page
app.get('/upload', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

/* -------------------- 404 Fallback -------------------- */

app.use((req, res) => {
  // Serve a custom 404 page if you have public/404.html
  res.status(404).sendFile(path.join(publicDir, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

/* -------------------- Start -------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
