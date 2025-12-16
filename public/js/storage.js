const STORAGE_KEY = 'rfp_data';

export function getRfps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setRfps(rfps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rfps));
}

export function generateId() {
  return Date.now().toString();
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
  });
}

export async function saveRfp({ projectName, productSummary, deadline, durationDays, status, file }) {
  const rfps = getRfps();
  const newRfp = {
    _id: generateId(),
    projectName,
    productSummary,
    deadline,
    durationDays,
    status,
    uploadedAt: new Date().toISOString(),
    fileName: null,
    fileData: null
  };

  if (file) {
    newRfp.fileName = file.name;
    newRfp.fileData = await fileToBase64(file);
  }

  rfps.push(newRfp);
  setRfps(rfps);
  return newRfp;
}

export function updateRfp(id, patch) {
  const rfps = getRfps();
  const idx = rfps.findIndex(r => r._id === id);
  if (idx === -1) throw new Error('RFP not found');
  rfps[idx] = { ...rfps[idx], ...patch };
  setRfps(rfps);
  return rfps[idx];
}

export function deleteRfp(id) {
  const rfps = getRfps();
  const next = rfps.filter(r => r._id !== id);
  setRfps(next);
}

export function getFileUrlFromBase64(base64Data) {
  if (!base64Data) return null;
  try {
    const base64 = base64Data.split(',')[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch {
    return base64Data;
  }
}

export function getRfpsByStatus(status) {
  const rfps = getRfps();
  const now = new Date();

  const filtered = rfps.filter(rfp => {
    const deadline = new Date(rfp.deadline);
    const st = (rfp.status || '').toLowerCase();

    switch (status) {
      case 'recent':
        return true;
      case 'completed':
        return deadline < now;
      case 'open':
        return st === 'open';
      case 'extended':
        return st === 'extended';
      default:
        return true;
    }
  });

  const byUploadedAtDesc = (a, b) => {
    const at = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bt = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bt - at;
  };

  const byDeadlineDesc = (a, b) => {
    const at = a.deadline ? new Date(a.deadline).getTime() : 0;
    const bt = b.deadline ? new Date(b.deadline).getTime() : 0;
    return bt - at;
  };

  if (status === 'completed') return filtered.sort(byDeadlineDesc);
  if (status === 'recent' || status === 'open' || status === 'extended') return filtered.sort(byUploadedAtDesc);
  return filtered;
}

export function encodeShareData(rfps) {
  const json = JSON.stringify(rfps);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeShareData(data) {
  const json = decodeURIComponent(escape(atob(data)));
  const parsed = JSON.parse(json);
  return Array.isArray(parsed) ? parsed : null;
}
