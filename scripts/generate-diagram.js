const path = require('path');
const fs = require('fs');

const W = 680;
const H = 860;

const boxes = [
  { y: 30,  label: 'Client',                          sub: 'HTTP Request' },
  { y: 130, label: 'POST /api/v1/events',              sub: 'Express Route' },
  { y: 230, label: 'Event Controller',                 sub: 'Validate · Orchestrate' },
  { y: 330, label: 'SQLite — events table',            sub: 'INSERT event → event_id' },
  { y: 430, label: 'SQLite — notifications table',     sub: 'INSERT notification (status: pending)' },
  { y: 530, label: 'In-Memory Queue',                  sub: 'Array-based async queue' },
  { y: 630, label: '202 Accepted  ←  Response',        sub: 'tracking_id · notification_id · status: pending' },
  { y: 730, label: 'Queue Worker (background)',         sub: 'Picks task · 500–1000ms delay · 10% fail rate' },
  { y: 830, label: 'SQLite — notifications table',     sub: 'UPDATE status → completed / failed' },
];

function box(x, y, w, h, fill, stroke) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function text(x, y, content, size, weight, color) {
  return `<text x="${x}" y="${y}" font-family="'Segoe UI',Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle">${content}</text>`;
}

function arrow(x, y1, y2, color = '#64748b') {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="url(#arrow)"/>`;
}

const COLORS = {
  client:  { fill: '#dbeafe', stroke: '#3b82f6' },
  api:     { fill: '#dcfce7', stroke: '#22c55e' },
  ctrl:    { fill: '#fef9c3', stroke: '#eab308' },
  db:      { fill: '#ede9fe', stroke: '#8b5cf6' },
  queue:   { fill: '#ffedd5', stroke: '#f97316' },
  resp:    { fill: '#d1fae5', stroke: '#10b981' },
  worker:  { fill: '#fce7f3', stroke: '#ec4899' },
};

const palette = [
  COLORS.client, COLORS.api, COLORS.ctrl,
  COLORS.db, COLORS.db, COLORS.queue,
  COLORS.resp, COLORS.worker, COLORS.db,
];

const BW = 520;
const BH = 56;
const BX = (W - BW) / 2;

let svgBoxes = '';
let svgLabels = '';
let svgArrows = '';

boxes.forEach((b, i) => {
  const c = palette[i];
  const cy = b.y - 30 + (i === 0 ? 30 : 0);
  const topY = b.y - 10;
  svgBoxes += box(BX, topY, BW, BH, c.fill, c.stroke) + '\n  ';
  svgLabels += text(W / 2, topY + 23, b.label, 13, 'bold', '#1e293b') + '\n  ';
  svgLabels += text(W / 2, topY + 42, b.sub, 10.5, 'normal', '#475569') + '\n  ';
  if (i < boxes.length - 1) {
    const ay1 = topY + BH;
    const ay2 = topY + BH + (100 - BH) + 10 - 2;
    const color = i === 5 ? '#10b981' : (i === 6 ? '#f97316' : '#64748b');
    svgArrows += arrow(W / 2, ay1, ay2 < ay1 + 4 ? ay1 + 4 : ay2, color) + '\n  ';
  }
});

const labelStep6 = `<text x="${W / 2 - 30}" y="${boxes[5].y + BH - 10 + 14}" font-family="'Segoe UI',Arial,sans-serif" font-size="9" fill="#10b981" text-anchor="middle">immediate</text>`;
const labelStep7 = `<text x="${W / 2 + 30}" y="${boxes[6].y - 10 + BH + 14}" font-family="'Segoe UI',Arial,sans-serif" font-size="9" fill="#f97316" text-anchor="middle">async</text>`;

const arrowTopY = boxes[5].y - 10 + BH;
const arrowBotY = boxes[6].y - 10 - 2;
const asyncLine = `
  <line x1="${W/2 - 2}" y1="${arrowTopY}" x2="${W/2 - 2}" y2="${arrowBotY}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-green)"/>
  <line x1="${W/2 + 2}" y1="${arrowTopY + 30}" x2="${W/2 + 2}" y2="${boxes[7].y - 10 - 2}" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-orange)"/>
`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 30}" viewBox="0 0 ${W} ${H + 30}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#64748b"/>
    </marker>
    <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#10b981"/>
    </marker>
    <marker id="arrow-orange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#f97316"/>
    </marker>
  </defs>

  <rect width="${W}" height="${H + 30}" fill="#f8fafc"/>

  <text x="${W/2}" y="22" font-family="'Segoe UI',Arial,sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">Event-Driven Notification Dispatcher — Architecture</text>

  ${svgArrows}
  ${svgBoxes}
  ${svgLabels}

  <text x="10" y="${H - 10}" font-family="'Segoe UI',Arial,sans-serif" font-size="9" fill="#94a3b8">
    ● Green dashed = immediate response path  ● Orange dashed = async background path
  </text>
</svg>`;

const svgPath = path.join(__dirname, '../architecture-diagram.svg');
const pngPath = path.join(__dirname, '../architecture-diagram.png');

fs.writeFileSync(svgPath, svg);
console.log('[Diagram] SVG written to', svgPath);

try {
  const sharp = require('sharp');
  sharp(Buffer.from(svg))
    .png()
    .toFile(pngPath)
    .then(() => {
      console.log('[Diagram] PNG written to', pngPath);
      fs.unlinkSync(svgPath);
    })
    .catch((err) => {
      console.error('[Diagram] sharp error:', err.message);
      console.log('[Diagram] SVG kept at', svgPath, '— rename to .png or open in browser.');
    });
} catch (e) {
  console.log('[Diagram] sharp not available — SVG saved. Run: npm install --save-dev sharp');
}
