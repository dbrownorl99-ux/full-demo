// src/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import linksRouter from './linksRouter.js';
import uploadsRouter from './uploadsRouter.js'; // handles file uploads to backend

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: allow your site origin; set ALLOWED_ORIGIN in Render env
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : [allowedOrigin] }));

// Serve /public statics. index:false keeps "/" from auto-serving index.html
app.use(express.static(publicDir, { index: false }));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// APIs
app.use('/api/links', linksRouter);         // create + fetch saved links
app.use('/api/upload', uploadsRouter);      // receive document uploads

// Web routes
// Homepage → generator
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'generate.html'));
});

// Customer upload page (only from generated link)
app.get('/u/:slug', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Optional admin
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// 404 fallback (optional)
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
