import { useState } from 'react';
import Icon from './Icon.jsx';

const THEMES = {
  primary: { bg: 'var(--coral)',    fg: '#fff',           bd: 'var(--ink)', sh: 'var(--ink)' },
  ink:     { bg: 'var(--ink)',      fg: '#fff',           bd: 'var(--ink)', sh: 'rgba(42,35,32,.35)' },
  blue:    { bg: 'var(--blue)',     fg: '#fff',           bd: 'var(--ink)', sh: 'var(--ink)' },
  ghost:   { bg: '#fff',            fg: 'var(--ink)',     bd: 'var(--ink)', sh: 'var(--ink)' },
  danger:  { bg: 'var(--coral)',    fg: '#fff',           bd: 'var(--ink)', sh: 'var(--ink)' },
  plain:   { bg: 'transparent',     fg: 'var(--ink-soft)',bd: 'transparent',sh: 'transparent' },
};

export default function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  full, onClick, disabled, type = 'button', title, style,
}) {
  const [down, setDown] = useState(false);

  const pads = size === 'sm' ? '9px 14px' : size === 'lg' ? '16px 26px' : '12px 20px';
  const fs   = size === 'sm' ? 13.5        : size === 'lg' ? 16.5        : 15;
  const t    = THEMES[variant] || THEMES.primary;
  const isPlain  = variant === 'plain';
  const offset   = isPlain ? 0 : (down ? 2 : 5);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: full ? '100%' : 'auto', padding: pads, fontSize: fs, fontWeight: 800,
        fontFamily: 'var(--sans)', color: t.fg, background: t.bg,
        border: isPlain ? 'none' : `2.5px solid ${t.bd}`,
        borderRadius: size === 'sm' ? 12 : 15,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: isPlain ? 'none' : `0 ${offset}px 0 ${t.sh}`,
        transform: `translateY(${isPlain ? 0 : (down ? 3 : 0)}px)`,
        transition: 'box-shadow .08s, transform .08s', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon      && <Icon name={icon}      size={fs + 2} stroke={2.4} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 2} stroke={2.4} />}
    </button>
  );
}
