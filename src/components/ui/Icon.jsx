const PATHS = {
  link:     '<path d="M9 13a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M15 11a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  copy:     '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  check:    '<path d="M5 12.5l4.5 4.5L19 7"/>',
  trash:    '<path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
  chart:    '<path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/>',
  settings: '<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/>',
  plus:     '<path d="M12 5v14"/><path d="M5 12h14"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  search:   '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  x:        '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  external: '<path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 13v5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5h5"/>',
  arrow:    '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 8l12 8"/><path d="M8 16L20 8"/>',
  globe:    '<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.5 2.5 2.5 13 0 16M12 4c-2.5 2.5-2.5 13 0 16"/>',
  qr:       '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h3v3M20 14v6M17 20h3M14 20h0"/>',
  zap:      '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  clock:    '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  back:     '<path d="M19 12H6"/><path d="M11 6l-6 6 6 6"/>',
};

export default function Icon({ name, size = 18, stroke = 2, style }) {
  const p = PATHS[name] || '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: p }}
    />
  );
}
