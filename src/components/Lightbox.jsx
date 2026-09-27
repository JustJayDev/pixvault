import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart } from 'lucide-react';
import { fullUrl, resolutionLabel, downloadOriginal, getDominantColor } from '../lib/wallpapers';

/**
 * Lightbox — full-bleed preview with ambient dominant-color glow,
 * keyboard + swipe navigation, and original download.
 */
const Lightbox = ({ list, index, onClose, onIndex, isFav, onFav }) => {
  const [dom, setDom] = useState(null);
  const wp = list[index];

  const go = useCallback(
    (dir) => {
      if (!list.length) return;
      const next = (index + dir + list.length) % list.length;
      onIndex(next);
    },
    [index, list, onIndex]
  );

  // keyboard navigation
  useEffect(() => {
    if (!wp) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wp, go, onClose]);

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ambient glow color from the image
  useEffect(() => {
    if (!wp) return;
    setDom(null);
    getDominantColor(fullUrl(wp)).then((c) => c && setDom(c));
  }, [wp]);

  // swipe support (touch)
  const [touchX, setTouchX] = useState(null);
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    setTouchX(null);
  };

  if (!wp) return null;
  const fav = isFav?.(wp.id);

  return (
    <div
      className="lightbox"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="lb-glow"
        style={{ '--dom': dom || 'transparent', background: dom || 'transparent' }}
        aria-hidden="true"
      />

      <div className="lb-image-wrap" onClick={(e) => e.stopPropagation()}>
        <img src={fullUrl(wp)} alt={wp.title} />
      </div>

      <button
        className="lb-close"
        onClick={onClose}
        aria-label="close"
        title="Close (Esc)"
      >
        <X size={20} />
      </button>

      {list.length > 1 && (
        <>
          <button
            className="lb-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="previous wallpaper"
            title="Previous (←)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="lb-nav next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="next wallpaper"
            title="Next (→)"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="lb-caption" onClick={(e) => e.stopPropagation()}>
        <div className="t">{wp.title}</div>
        <div className="m">
          {resolutionLabel(wp)} · {wp.category} · {index + 1}/{list.length}
        </div>
      </div>

      <div className="lb-dl" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn"
          style={{ width: 36, height: 36, border: 'none', background: 'transparent' }}
          onClick={() => onFav?.(wp.id)}
          aria-label={fav ? 'remove from favorites' : 'add to favorites'}
          title={fav ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={17} fill={fav ? 'var(--accent)' : 'none'} style={fav ? { color: 'var(--accent)' } : {}} />
        </button>
        <button
          className="icon-btn"
          style={{ width: 36, height: 36, border: 'none', background: 'transparent' }}
          onClick={() => downloadOriginal(wp)}
          aria-label="download original"
          title="Download original"
        >
          <Download size={17} />
        </button>
      </div>
    </div>
  );
};

export default Lightbox;