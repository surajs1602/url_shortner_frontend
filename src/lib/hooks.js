import { useEffect, useState } from 'react';

// Returns current breakpoint flags, updated on every window resize.
export function useBreakpoint() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return { isMobile: w < 640, isTablet: w < 1024 };
}
