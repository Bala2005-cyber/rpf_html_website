import { setActiveNav, formatDeadline, escapeHtml } from './common.js';
import { getRfpsByStatus, getFileUrlFromBase64, deleteRfp, getRfps, setRfps } from './storage.js';
import { filterDefaultsByTab } from './defaults.js';

let activeTab = 'recent';

function getModalEls() {
  return {
    modal: document.getElementById('pdfModal'),
    backdrop: document.getElementById('pdfBackdrop'),
    closeBtn: document.getElementById('pdfClose'),
    title: document.getElementById('pdfTitle'),
    frame: document.getElementById('pdfFrame')
  };
}

function openPdfInModal(url, title) {
  // Check if we're on a hosted platform (HTTPS) and prefer new tab for compatibility
  const isHosted = window.location.protocol === 'https:';
  
  if (isHosted) {
    console.log('Hosted platform detected, opening PDF in new tab for better compatibility');
    openPdfInNewTab(url);
    return;
  }
  
  // For local development, try modal viewing
  const { modal, title: titleEl, frame } = getModalEls();
  if (!modal || !frame || !titleEl) {
    openPdfInNewTab(url);
    return;
  }

  titleEl.textContent = title || 'Document';
  
  // Ensure URL is HTTPS for hosted environments
  const secureUrl = url.replace(/^http:/, 'https:');
  
  // Try multiple secure PDF viewing methods
  const viewerUrls = [
    secureUrl, // Direct HTTPS PDF
    `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`, // Google Docs Viewer
    `https://r.jina.ai/http://${secureUrl.replace(/^https?:\/\//, '')}` // Jina AI fallback
  ];
  
  let attemptIndex = 0;
  
  function tryNextViewer() {
    if (attemptIndex >= viewerUrls.length) {
      console.log('All PDF viewers failed, opening in new tab');
      openPdfInNewTab(secureUrl);
      closePdfModal();
      return;
    }
    
    const viewerUrl = viewerUrls[attemptIndex];
    console.log(`Trying PDF viewer ${attemptIndex + 1}: ${viewerUrl}`);
    
    // Clear previous content and set new source
    frame.src = 'about:blank';
    setTimeout(() => {
      frame.src = viewerUrl;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }, 100);

    // Enhanced fallback for hosted environments
    let loadTimeout = setTimeout(() => {
      console.log(`PDF viewer ${attemptIndex + 1} timeout, trying next`);
      attemptIndex++;
      tryNextViewer();
    }, 4000);

    frame.onload = () => {
      clearTimeout(loadTimeout);
      // Additional check: verify PDF actually loaded
      try {
        const iframeDoc = frame.contentDocument || frame.contentWindow.document;
        if (!iframeDoc || iframeDoc.title.includes('404') || iframeDoc.title.includes('Error') || iframeDoc.title.includes('Blocked')) {
          console.log(`PDF viewer ${attemptIndex + 1} failed, trying next`);
          attemptIndex++;
          tryNextViewer();
        } else {
          console.log(`PDF viewer ${attemptIndex + 1} loaded successfully`);
        }
      } catch (e) {
        // Cross-origin error - likely PDF loaded successfully
        console.log(`PDF viewer ${attemptIndex + 1} loaded (cross-origin check passed)`);
      }
    };

    frame.onerror = () => {
      clearTimeout(loadTimeout);
      console.log(`PDF viewer ${attemptIndex + 1} error, trying next`);
      attemptIndex++;
      tryNextViewer();
    };
  }
  
  tryNextViewer();
}

function openPdfInNewTab(url) {
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    // If popup blocked, try direct navigation
    window.location.href = url;
  }
}

function closePdfModal() {
  const { modal, title, frame } = getModalEls();
  if (!modal || !frame) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  frame.src = '';
  if (title) title.textContent = 'Document';
}

function getItemsForTab(tab) {
  const stored = getRfpsByStatus(tab);
  if (stored.length > 0) return stored;
  return filterDefaultsByTab(tab);
}

function matchesSearch(rfp, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    (rfp.projectName || '').toLowerCase().includes(needle) ||
    (rfp.productSummary || '').toLowerCase().includes(needle) ||
    (rfp.status || '').toLowerCase().includes(needle) ||
    (rfp.deadline || '').toLowerCase().includes(needle)
  );
}

function viewDoc(rfp) {
  const url = rfp.fileUrl ? rfp.fileUrl : getFileUrlFromBase64(rfp.fileData);
  if (!url) return;
  openPdfInModal(url, rfp.fileName || 'Document');
}

function downloadDoc(rfp) {
  const url = rfp.fileUrl ? rfp.fileUrl : getFileUrlFromBase64(rfp.fileData);
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = rfp.fileName || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function render() {
  const cardsEl = document.getElementById('cards');
  const q = (document.getElementById('search')?.value || '').trim();
  const items = getItemsForTab(activeTab).filter(r => matchesSearch(r, q));

  cardsEl.innerHTML = items.map(rfp => {
    const status = (rfp.status || 'open').toLowerCase();
    const isDefault = String(rfp._id || '').startsWith('default-');
    const fileLabel = escapeHtml(rfp.fileName || 'Document');

    const statusClass = status === 'closed' ? 'completed' : status;
    const badgeClass = status === 'closed' ? 'completed' : status;

    const showDelete = !isDefault;

    return `
      <div class="rfp-card ${escapeHtml(statusClass)}">
        <div class="card-header">
          <span>Project Name</span>
          <div class="header-right">
            <span class="status-badge ${escapeHtml(badgeClass)}">${escapeHtml(status)}</span>
            ${showDelete ? `<button class="delete-btn-header" data-delete="${escapeHtml(rfp._id)}">Delete</button>` : ''}
          </div>
        </div>

        <h2>${escapeHtml(rfp.projectName || '')}</h2>

        <div class="summary">
          <h3>Product Requirement Summary</h3>
          <p>"${escapeHtml(rfp.productSummary || '')}"</p>
        </div>

        <div class="key-info">
          <h3>Key Information</h3>
          <div class="info-grid">
            <div><span>Deadline: ${escapeHtml(formatDeadline(rfp.deadline))}</span></div>
            <div><span>Project Duration:</span><strong>${escapeHtml(rfp.durationDays)} days</strong></div>
          </div>
        </div>

        <div class="card-actions">
          <div class="document-link">
            <span class="link-label">View Document:</span>
            <div class="document-actions">
              <button class="document-link-url" data-view="${escapeHtml(rfp._id)}" type="button">${fileLabel}</button>
              <button class="download-btn-small" data-download="${escapeHtml(rfp._id)}" type="button">Download</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const idToRfp = new Map(items.map(i => [i._id, i]));

  cardsEl.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => viewDoc(idToRfp.get(btn.getAttribute('data-view'))));
  });

  cardsEl.querySelectorAll('[data-download]').forEach(btn => {
    btn.addEventListener('click', () => downloadDoc(idToRfp.get(btn.getAttribute('data-download'))));
  });

  cardsEl.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete');
      if (!window.confirm('Delete this RFP?')) return;
      deleteRfp(id);
      render();
    });
  });
}

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.filter-tabs button').forEach(t => t.classList.remove('active'));
  document.querySelector(`.filter-tabs button[data-tab="${tab}"]`)?.classList.add('active');
  render();
}

function init() {
  setActiveNav();

  const { backdrop, closeBtn } = getModalEls();
  backdrop?.addEventListener('click', closePdfModal);
  closeBtn?.addEventListener('click', closePdfModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePdfModal();
  });

  document.querySelectorAll('.filter-tabs button').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.getAttribute('data-tab')));
  });

  document.getElementById('search')?.addEventListener('input', render);

  // load from share link (optional)
  const url = new URL(window.location.href);
  const data = url.searchParams.get('data');
  if (data) {
    try {
      const json = decodeURIComponent(escape(atob(data)));
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) setRfps(parsed);
    } catch {
      // ignore
    }
  }

  setTab('recent');
}

document.addEventListener('DOMContentLoaded', init);
