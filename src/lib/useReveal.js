import { useEffect } from 'react';

/**
 * useReveal — adds .in to every .reveal element as it enters the viewport.
 * Uses MutationObserver so cards rendered after filter changes are picked up.
 */
export function useReveal() {
  useEffect(() => {
    let io = null;
    let mo = null;
    const seen = new WeakSet();

    const observe = (el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (!io) return;
      io.observe(el);
    };

    const scan = () => {
      const els = Array.from(document.querySelectorAll('.reveal'));
      if (!('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('in'));
        return;
      }
      if (!io) {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
        );
      }
      els.forEach(observe);
    };

    scan();

    if ('MutationObserver' in window) {
      mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node;
            if (el.classList && el.classList.contains('reveal')) observe(el);
            el.querySelectorAll?.('.reveal').forEach(observe);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      io?.disconnect();
      mo?.disconnect();
    };
  }, []);
}