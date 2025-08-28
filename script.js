(function () {
  const form = document.getElementById('uploadForm');
  const statusBox = document.getElementById('status');
  const submitBtn = document.getElementById('submitBtn');

  function setStatus(message, type) {
    if (!statusBox) return;
    statusBox.textContent = message || '';
    statusBox.className = 'status ' + (type || '');
  }

  function busy(isBusy) {
    if (!submitBtn) return;
    submitBtn.disabled = !!isBusy;
    submitBtn.textContent = isBusy ? 'Uploading…' : 'Upload Documents';
  }

  // Preview helper (images only; hides preview for PDFs)
  function wirePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        preview.src = '';
        preview.style.display = 'none';
        return;
      }
      if (file.type && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
      } else {
        preview.src = '';
        preview.style.display = 'none';
      }
    });
  }

  // Wire up previews
  wirePreview('license', 'license-preview');
  wirePreview('registration', 'registration-preview');
  wirePreview('insurance', 'insurance-preview');
  wirePreview('paystub', 'paystub-preview');
  wirePreview('residence', 'residence-preview');
  wirePreview('other', 'other-preview');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const appIdEl = document.getElementById('appId');
    if (!appIdEl || !appIdEl.value.trim()) {
      setStatus('Please enter your 7-digit Application ID.', 'error');
      appIdEl && appIdEl.focus();
      return;
    }
    if (!/^\d{7}$/.test(appIdEl.value.trim())) {
      setStatus('Application ID must be exactly 7 digits.', 'error');
      appIdEl.focus();
      return;
    }

    try {
      busy(true);
      const fd = new FormData(form);

      // Endpoint from window override or local dev
      const endpoint = window.ORL_BACKEND_URL || 'http://localhost:8080/api/upload';
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();

      if (data && data.ok) {
        setStatus('Documents uploaded and emailed successfully.', 'success');
        form.reset();
        // Hide any previews
        Array.from(document.querySelectorAll('.file-preview')).forEach(img => {
          img.src = '';
          img.style.display = 'none';
        });
        // Optional: show your existing messages
        const uploadedMsg = document.getElementById('uploadedMessage');
        const successMsg = document.getElementById('successMessage');
        if (uploadedMsg) uploadedMsg.classList.remove('hidden');
        if (successMsg) successMsg.classList.remove('hidden');
        setTimeout(() => {
          if (uploadedMsg) uploadedMsg.classList.add('hidden');
          if (successMsg) successMsg.classList.add('hidden');
        }, 3500);
      } else {
        setStatus('Upload failed: ' + (data?.error || 'Server error'), 'error');
      }
    } catch (err) {
      setStatus('Network error: ' + (err?.message || err), 'error');
    } finally {
      busy(false);
    }
  });
})();
