import { useEffect } from 'react';

/**
 * useGlow — tracks the pointer and writes --mx/--my (percent) onto every
 * .glass-card so its radial highlight follows the cursor. No JS dependency
 * on React state; pure DOM, passive listener, disabled on touch-only devices.
 */
export function useGlow() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (e) => {
      const cards = document.querySelectorAll('.glass-card');
      cards.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (
          e.clientX < r.left - 60 || e.clientX > r.right + 60 ||
          e.clientY < r.top - 60 || e.clientY > r.bottom + 60
        ) return;
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty('--mx', mx.toFixed(1) + '%');
        el.style.setProperty('--my', my.toFixed(1) + '%');
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}