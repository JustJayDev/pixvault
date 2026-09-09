import React, { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import WallpaperDetail from './pages/WallpaperDetail.jsx'
import About from './pages/About.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  const location = useLocation()
  return (
    <Layout key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/w/:id" element={<WallpaperDetail />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}