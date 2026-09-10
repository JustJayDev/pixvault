import React, { useEffect, useRef } from 'react'

/* Scroll-reveal wrapper — fades/slides children in when they enter viewport */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </Tag>
  )
}

/* 3D tilt card with cursor-tracking glow */
export function Tilt({ children, className = '', max = 7 }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg) translateZ(0)`
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (el) el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt ${className}`}>
      {children}
      <div className="tilt-glow" />
    </div>
  )
}

/* Word-by-word masked headline reveal */
export function Words({ text, className = '', startDelay = 0, step = 90 }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="word-mask">
          <span style={{ '--wd': `${startDelay + i * step}ms` }}>{word}</span>
          {i < text.split(' ').length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}