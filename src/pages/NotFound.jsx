import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div
      className="wrap"
      style={{ paddingTop: 90, paddingBottom: 60, textAlign: 'center' }}
    >
      <div
        className="font-serif text-gradient"
        style={{ fontSize: 'clamp(72px, 16vw, 150px)', fontWeight: 700, lineHeight: 1 }}
      >
        404
      </div>
      <p className="font-mono" style={{ color: 'var(--muted)', margin: '18px 0 6px', fontSize: 13 }}>
        &gt; error: chamber_not_found
      </p>
      <p style={{ color: 'var(--dim)', margin: '0 0 26px', fontSize: 14 }}>
        This part of the vault doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={16} /> Back to the vault
      </Link>
    </div>
  );
};

export default NotFound;