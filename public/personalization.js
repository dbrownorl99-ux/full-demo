// personalization.js
// Reads ?appId=&name= from URL and injects into your upload form.
// It also updates any email subject fields with the app ID if present.

(function () {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appId') || '';
  const name = params.get('name') || '';
  // Try to fill common input ids/names
  const bySelectors = [
    '#appId', 'input[name="appId"]', 'input[name="applicationId"]', 'input[name="Application ID"]', 'input[placeholder*="App ID" i]'
  ];
  const nameSelectors = [
    '#customerName', 'input[name="name"]', 'input[name="customerName"]', 'input[placeholder*="Name" i]'
  ];

  function fillFirst(selectors, value) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { el.value = value; return el; }
    }
    return null;
  }

  const appEl = fillFirst(bySelectors, appId);
  const nameEl = fillFirst(nameSelectors, name);

  // Show a small header tag if we have context
  if (appId || name) {
    const banner = document.createElement('div');
    banner.className = 'prefill-banner';
    banner.innerHTML = `<strong>Customer:</strong> ${name || 'Unknown'} &nbsp; • &nbsp; <strong>App ID:</strong> ${appId || '—'}`;
    Object.assign(banner.style, {
      margin: '12px 0',
      padding: '12px 16px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg,#16a34a20,#16a34a08)',
      border: '1px solid #16a34a40',
      color: '#16a34a',
      fontWeight: '600'
    });
    const host = document.querySelector('main, .container, body');
    host?.prepend(banner);
  }

  // Update any subject field
  const subject = document.querySelector('input[name="_subject"], input[name="subject"], input[placeholder*="subject" i]');
  if (subject && appId) {
    if (!subject.value || !subject.value.includes(appId)) {
      subject.value = `Application ${appId}`;
    }
  }
})();
