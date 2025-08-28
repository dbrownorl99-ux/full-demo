// --- imports ---
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { upload, collectAttachments } from './upload.js';
import { buildTransport, sendDocsEmail } from './mailer.js';
import { DOC_LABELS } from './filename.js';
import linksRouter from './linksRouter.js';  // <-- inside src now
app.use('/api/links', linksRouter);

// --- dirname helpers (ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// --- create app FIRST ---
const app = express();

// --- core middleware ---
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({ origin: allowedOrigin ? [allowedOrigin] : true, credentials: false }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 });
app.use('/api/', limiter);

// --- static files (serve your frontend) ---
app.use(express.static(path.join(__dirname, '..', 'public'))); 
// If your files are at the repo root instead of /public, use this:
// app.use(express.static(path.join(__dirname, '..')));

// --- healthcheck ---
app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// --- links API + personal URL redirect ---
app.use('/api/links', linksRouter);

app.get('/u/:slug', (req, res) => {
  const dataFile = path.join(__dirname, '..', 'data', 'links.json');
  const links = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : [];
  const link = links.find(l => l.slug === req.params.slug);
  if (!link) return res.status(404).send('Not found');
  res.redirect(`/index.html?appId=${encodeURIComponent(link.appId)}&name=${encodeURIComponent(link.name)}`);
});

// --- upload endpoint ---
app.post('/api/upload', upload.fields([
  { name: 'dl', maxCount: 1 },
  { name: 'registration', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'income', maxCount: 1 },
  { name: 'other', maxCount: 3 }
]), async (req, res) => {
  try {
    const { applicationId, customerName, customerEmail } = req.body;
    if (!applicationId) return res.status(400).json({ ok: false, error: 'applicationId is required' });

    const files = Object.values(req.files || {}).flat();
    if (!files.length) return res.status(400).json({ ok: false, error: 'No files uploaded' });

    const transport = buildTransport({
      host: process.env.SMTP_HOST, port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE, user: process.env.SMTP_USER, pass: process.env.SMTP_PASS
    });

    const to = process.env.TO_EMAIL;
    if (!to) return res.status(500).json({ ok: false, error: 'Server email not configured (TO_EMAIL missing)' });

    const subject = `New docs for Application ${applicationId}${customerName ? ' - ' + customerName : ''}`;
    const fileListHtml = files.map(f => {
      const label = DOC_LABELS[f.fieldname] || f.fieldname;
      return `<li><b>${label}</b> — ${f.originalname} (${Math.round(f.size/1024)} KB)</li>`;
    }).join('');

    const html = `
      <p>You received new document uploads.</p>
      <ul>
        <li><b>Application ID:</b> ${applicationId}</li>
        ${customerName ? `<li><b>Customer Name:</b> ${customerName}</li>` : ''}
        ${customerEmail ? `<li><b>Customer Email:</b> ${customerEmail}</li>` : ''}
      </ul>
      <p><b>Files:</b></p>
      <ul>${fileListHtml}</ul>
    `;
    const text = `New document uploads
Application ID: ${applicationId}
${customerName ? 'Customer Name: ' + customerName + '\n' : ''}${customerEmail ? 'Customer Email: ' + customerEmail + '\n' : ''}
Files:
${files.map(f => ` - ${(DOC_LABELS[f.fieldname] || f.fieldname)}: ${f.originalname} (${Math.round(f.size/1024)} KB)`).join('\n')}
`;

    const attachments = collectAttachments(files);
    await sendDocsEmail(transport, { to, from: process.env.SMTP_USER, subject, text, html, attachments });

    res.json({ ok: true, message: 'Uploaded and emailed successfully', files: files.map(f => f.filename) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

// --- start ---
const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

