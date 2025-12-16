export function calculateDurationFromDate(deadlineDate) {
  if (!deadlineDate) return 0;
  const today = new Date();
  const deadline = new Date(deadlineDate);
  const diff = deadline.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days > 0 ? days : 0;
}

export function getDefaultRfps() {
  const pdfPath = encodeURI('/REQUEST FOR PROPOSAL (RFP) (2).pdf');

  const d1 = '2026-04-30';
  const d2 = '2026-06-15';
  const d3 = '2026-05-20';

  return [
    {
      _id: 'default-dmrc',
      projectName: 'DELHI METRO RAIL CORPORATION (DMRC)',
      productSummary: 'Supply of Control and Communications grade Copper Cables',
      deadline: d1,
      durationDays: calculateDurationFromDate(d1),
      status: 'open',
      uploadedAt: new Date().toISOString(),
      fileUrl: pdfPath,
      fileName: 'REQUEST FOR PROPOSAL (RFP) (2).pdf'
    },
    {
      _id: 'default-drl',
      projectName: 'DELHI RAIL LIMITED (DRL)',
      productSummary: 'Supply and Installation of Station Networking Equipment',
      deadline: d2,
      durationDays: calculateDurationFromDate(d2),
      status: 'open',
      uploadedAt: new Date().toISOString(),
      fileUrl: 'about:blank',
      fileName: 'Document'
    },
    {
      _id: 'default-dmrc-phase4',
      projectName: 'DELHI METRO RAIL CORPORATION (DMRC) - PHASE 4',
      productSummary: 'Supply of Industrial Grade Fiber Optic Cables',
      deadline: d3,
      durationDays: calculateDurationFromDate(d3),
      status: 'extended',
      uploadedAt: new Date().toISOString(),
      fileUrl: 'about:blank',
      fileName: 'Document'
    }
  ];
}

export function filterDefaultsByTab(tab) {
  const defaults = getDefaultRfps();
  const now = new Date();
  switch (tab) {
    case 'recent':
      return defaults;
    case 'open':
      return defaults.filter(r => (r.status || '').toLowerCase() === 'open');
    case 'extended':
      return defaults.filter(r => (r.status || '').toLowerCase() === 'extended');
    case 'completed':
      return defaults.filter(r => new Date(r.deadline) < now);
    default:
      return defaults;
  }
}
