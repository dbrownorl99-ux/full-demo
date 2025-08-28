// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PUBLIC DIR (adjust if your structure differs)
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow your site origin (set ALLOWED_ORIGIN in Render env vars)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? true : [allowedOrigin],
    credentials: false,
  })
);

// Serve static files BUT DO NOT auto-serve index.html at "/"
app.use(express.static(publicDir, { index: false }));

/* ---------- Routes ---------- */

// Health check (Render uses this sometimes; also handy for you)
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Homepage → Page Generator
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'generate.html'));
});

// Optional admin dashboard (if you have it)
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

/**
 * Customer upload links.
 *
 * If your existing app already has its own /u/:slug handler that builds a
 * redirect to `/index.html?appId=...&name=...`, keep that.
 * If not, serving index.html directly here is safe; your client code can
 * read the slug from location.pathname and fetch data as needed.
 */
app.get('/u/:slug', (req, res) => {
  // If you previously did a server-side redirect based on slug → querystring,
  // you can restore it here by looking up the slug from your storage and
  // calling res.redirect(`/index.html?...`).
  // Otherwise, just serve the upload page and let the client handle the slug.
  res.sendFile(path.join(publicDir, 'index.html'));
});

// (Optional) direct /upload route to the same upload page
app.get('/upload', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

/* ---------- (Keep your API routers here) ---------- */
// Example:
// import linksRouter from './linksRouter.js';
// app.use('/api/links', linksRouter);

/* ---------- Fallback 404 for unmatched routes ---------- */
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
