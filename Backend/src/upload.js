import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { buildLabeledFilename, DOC_LABELS } from './filename.js';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MB = 1024 * 1024;
const maxSize = Number(process.env.MAX_FILE_SIZE_MB || 15) * MB;

// Only allow common image/PDF types
const allowedMimes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'image/heic', 'image/heif'
]);

function fileFilter(req, file, cb) {
  if (allowedMimes.has(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported file type. Please upload images or PDFs.'));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const appId = req.body.applicationId || req.body.appId || 'NO_APP_ID';
    const docType = DOC_LABELS[file.fieldname] || file.fieldname || 'document';
    cb(null, buildLabeledFilename({ appId, docType, originalName: file.originalname }));
  }
});

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize, files: 10 }
});

export function collectAttachments(files) {
  // Multer gives us { fieldname, originalname, encoding, mimetype, destination, filename, path, size }
  return (files || []).map(f => ({
    filename: f.filename,
    path: f.path,
    contentType: f.mimetype
  }));
}
