import { setActiveNav } from './common.js';
import { saveRfp } from './storage.js';
import { calculateDurationFromDate } from './defaults.js';

function byId(id) { return document.getElementById(id); }

function setStatus(statusEl, message, type) {
  statusEl.textContent = '';
  statusEl.className = '';
  if (!message) return;

  statusEl.textContent = message;
  if (type) {
    statusEl.className = `submit-status ${type}`;
  }
}

function setFilePill(file) {
  const pill = byId('filePill');
  if (!pill) return;
  if (!file) {
    pill.style.display = 'none';
    pill.textContent = '';
    return;
  }

  pill.style.display = 'block';
  pill.textContent = `Uploading: ${file.name}`;
}

function init() {
  setActiveNav();

  const deadline = byId('deadline');
  const duration = byId('durationDays');
  const form = byId('uploadForm');
  const statusEl = byId('statusMsg');
  const dropZone = byId('dropZone');
  const fileInput = byId('file');

  deadline.addEventListener('change', () => {
    duration.value = String(calculateDurationFromDate(deadline.value));
  });

  if (dropZone && fileInput) {
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    dropZone.addEventListener('dragenter', (e) => {
      prevent(e);
      dropZone.classList.add('dragging');
    });
    dropZone.addEventListener('dragover', (e) => {
      prevent(e);
      dropZone.classList.add('dragging');
    });
    dropZone.addEventListener('dragleave', (e) => {
      prevent(e);
      dropZone.classList.remove('dragging');
    });
    dropZone.addEventListener('drop', (e) => {
      prevent(e);
      dropZone.classList.remove('dragging');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        fileInput.files = files;
        setFilePill(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      setFilePill(fileInput.files?.[0] || null);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(statusEl, '', '');

    const projectName = byId('projectName').value.trim();
    const productSummary = byId('productSummary').value.trim();
    const status = byId('status').value;
    const deadlineVal = deadline.value;
    const durationDays = Number(duration.value || 0);
    const file = byId('file').files?.[0] || null;

    if (!projectName) {
      setStatus(statusEl, 'Project name is required.', 'error');
      return;
    }
    if (!productSummary) {
      setStatus(statusEl, 'Product requirement summary is required.', 'error');
      return;
    }
    if (!deadlineVal) {
      setStatus(statusEl, 'Deadline date is required.', 'error');
      return;
    }
    if (!file) {
      setStatus(statusEl, 'Please select a PDF file.', 'error');
      return;
    }

    try {
      await saveRfp({ projectName, productSummary, deadline: deadlineVal, durationDays, status, file });
      setStatus(statusEl, 'RFP saved successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/browse.html';
      }, 900);
    } catch (err) {
      setStatus(statusEl, err?.message || 'Failed to save RFP.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
