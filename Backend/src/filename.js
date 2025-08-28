import path from 'path';

/**
 * Make a clean, descriptive filename like:
 *   APP1234_driver_license_2025-08-27T15-22-55-123Z.jpg
 */
export function buildLabeledFilename({ appId, docType, originalName }) {
  const safeId = String(appId || 'NO_APP_ID').trim().replace(/[^a-z0-9-_]/gi, '_');
  const safeDoc = String(docType || 'document').trim().replace(/[^a-z0-9-_]/gi, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = path.extname(originalName || '').toLowerCase();
  return `${safeId}_${safeDoc}_${ts}${ext || ''}`;
}

// Map input names to readable labels
export const DOC_LABELS = {
  dl: 'driver_license',
  registration: 'registration',
  insurance: 'insurance_card',
  income: 'proof_of_income',
  other: 'other_document'
};
