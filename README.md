# ORL Backend (Uploads + Email)

A tiny Express server that receives document uploads from your front end, renames files using the Application ID, and emails them to you as attachments.

## Quick start

1) Install dependencies
```bash
npm install
```

2) Create your `.env`
```bash
cp .env.example .env
# then edit .env with your SMTP credentials and allowed origin
```

3) Run it
```bash
npm run dev
# Server at http://localhost:8080
```

## API

**POST** `/api/upload` (multipart/form-data)

Fields:
- `applicationId` (required)
- `customerName` (optional)
- `customerEmail` (optional)

Files (any/all are optional):
- `dl` (Driver License)
- `registration`
- `insurance`
- `income`
- `other` (up to 3)

### Response
```json
{ "ok": true, "message": "Uploaded and emailed successfully", "files": ["APP123_driver_license_...jpg"] }
```

## Frontend wiring (example)

Change your form to this action:
```html
<form id="uploadForm" enctype="multipart/form-data">
  <input type="text" name="applicationId" placeholder="Application ID" required />
  <input type="text" name="customerName" placeholder="Customer name" />
  <input type="email" name="customerEmail" placeholder="Customer email" />

  <input type="file" name="dl" accept="image/*,application/pdf" />
  <input type="file" name="registration" accept="image/*,application/pdf" />
  <input type="file" name="insurance" accept="image/*,application/pdf" />
  <input type="file" name="income" accept="image/*,application/pdf" />
  <input type="file" name="other" accept="image/*,application/pdf" multiple />

  <button type="submit">Upload</button>
</form>
<script>
const form = document.getElementById('uploadForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const res = await fetch('http://localhost:8080/api/upload', {
    method: 'POST',
    body: fd
  });
  const data = await res.json();
  if (data.ok) alert('Uploaded!');
  else alert('Error: ' + data.error);
});
</script>
```

## Notes
- Files are saved under the `uploads/` folder using descriptive names like `APP1234_driver_license_2025-08-27T15-22-55-123Z.jpg`.
- Allowed types: images (jpeg, png, webp, gif, heic/heif) and PDF.
- Max file size defaults to 15 MB per file (configurable).
- Emails are sent with all uploaded files attached to `TO_EMAIL`.
- For production, run behind HTTPS (e.g., Nginx). Consider S3 for storage if you want to persist files long-term.
