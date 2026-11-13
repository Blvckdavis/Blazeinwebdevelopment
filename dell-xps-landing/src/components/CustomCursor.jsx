import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function CustomCursor() {
  useEffect(() => {
    const root = document.documentElement
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    let x = -100
    let y = -100
    const hide = () => root.classList.remove('cursor-active', 'cursor-over-control')
    const move = (event) => {
      if (!query.matches || event.pointerType === 'touch') return hide()
      x = event.clientX
      y = event.clientY
      root.classList.add('cursor-active')
      root.classList.toggle('cursor-over-control', Boolean(event.target.closest('a[href], button:not(:disabled), [role="button"], input, select, textarea')))
      if (!frame) frame = requestAnimationFrame(() => {
        root.style.setProperty('--cursor-x', `${x}px`)
        root.style.setProperty('--cursor-y', `${y}px`)
        frame = 0
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('blur', hide)
    document.addEventListener('pointerleave', hide)
    query.addEventListener('change', hide)
    return () => {
      cancelAnimationFrame(frame)
      hide()
      root.style.removeProperty('--cursor-x')
      root.style.removeProperty('--cursor-y')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', hide)
      document.removeEventListener('pointerleave', hide)
      query.removeEventListener('change', hide)
    }
  }, [])

  return createPortal(<div className="custom-cursor" aria-hidden="true" />, document.body)
}
