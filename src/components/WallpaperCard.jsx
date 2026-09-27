import React, { useState } from 'react';
import { Heart, Download, Eye } from 'lucide-react';
import { thumbUrl, aspectRatio, resolutionLabel, downloadOriginal } from '../lib/wallpapers';

/**
 * WallpaperCard — masonry tile with blur-up load, hover overlay,
 * favorite toggle and one-tap original download.
 */
const WallpaperCard = ({ wp, isFav, onFav, onOpen, index = 0 }) => {
  const [loaded, setLoaded] = useState(false);
  const ar = aspectRatio(wp);

  return (
    <div
      className="wp-card reveal"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      onClick={() => onOpen?.(wp)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(wp);
        }
      }}
    >
      <div className="wp-thumb" style={{ aspectRatio: `${ar}` }}>
        <img
          src={thumbUrl(wp)}
          alt={wp.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={loaded ? 'loaded' : ''}
        />
        {!loaded && <div className="wp-shimmer" aria-hidden="true" />}
      </div>

      <div className="wp-overlay">
        <div className="wp-title">{wp.title}</div>
        <div className="wp-meta">
          <span>{resolutionLabel(wp)}</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{wp.category}</span>
        </div>
      </div>

      <div className="wp-actions">
        <button
          className={'icon-btn' + (isFav ? ' faved' : '')}
          onClick={(e) => {
            e.stopPropagation();
            onFav?.(wp.id);
          }}
          aria-label={isFav ? 'remove from favorites' : 'add to favorites'}
          title={isFav ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button
          className="icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            downloadOriginal(wp);
          }}
          aria-label="download original"
          title="Download original"
        >
          <Download size={15} />
        </button>
      </div>

      <span className="badge">
        <Eye size={9} style={{ verticalAlign: 'middle', marginRight: 3 }} />
        {wp.device === 'phone' ? 'Mobile' : wp.device === 'desktop' ? 'Desktop' : 'Wallpaper'}
      </span>
    </div>
  );
};

export default WallpaperCard;