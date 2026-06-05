import { useState } from 'react';

export default function Card({ children, style, pad = 22, hover, onClick }) {
  const [h, setH] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: '#fff',
        border: '2.5px solid var(--ink)',
        borderRadius: 22,
        padding: pad,
        boxShadow: hover && h ? '0 9px 0 var(--ink)' : '0 6px 0 var(--ink)',
        transform: hover && h ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow .12s, transform .12s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
