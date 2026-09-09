import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl font-bold grad-text">404</p>
      <p className="mt-3 font-display text-xl font-semibold">This chamber is empty</p>
      <p className="mt-1 text-sm text-slate-400">The wallpaper you are looking for is not in the vault.</p>
      <Link to="/" className="btn-primary shine mt-8">Back to the vault</Link>
    </div>
  )
}