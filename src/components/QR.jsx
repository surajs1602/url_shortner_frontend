import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

function hashSeed(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h || 7;
}

function fakeQrCells(seed) {
  const n = 21;
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s >>> 16) / 0x8000; };
  // Reproduce finder-pattern corners so it visually resembles a real QR.
  const fin = (fx, fy) => fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
  const cells = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let on;
      if (x < 7 && y < 7) on = fin(x, y);
      else if (x >= n - 7 && y < 7) on = fin(x - (n - 7), y);
      else if (x < 7 && y >= n - 7) on = fin(x, y - (n - 7));
      else on = rnd() > 0.52;
      cells.push(on);
    }
  }
  return cells;
}

export default function QR({ text, px = 4, fg = '#2a2320' }) {
  // Memoised so the expensive generation only re-runs when text or size changes.
  const { cells, n, isFake } = useMemo(() => {
    try {
      const q = qrcode(0, 'M');
      q.addData(text || ' ');
      q.make();
      const n = q.getModuleCount();
      const cells = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push(q.isDark(r, c));
      return { cells, n, isFake: false };
    } catch {
      return { cells: fakeQrCells(hashSeed(text || '')), n: 21, isFake: true };
    }
  }, [text, px]);

  return (
    <div
      // Inform assistive tech whether this is a real scannable code or a placeholder.
      aria-label={isFake ? 'QR code unavailable — copy the link instead' : `QR code for ${text}`}
      title={isFake ? 'QR generation failed — copy the link instead' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, ${px}px)`,
        gridAutoRows: `${px}px`,
        lineHeight: 0,
        opacity: isFake ? 0.4 : 1,
      }}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ width: px, height: px, background: on ? fg : 'transparent' }} />
      ))}
    </div>
  );
}
