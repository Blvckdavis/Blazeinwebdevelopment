import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const specifications = [
  ['Display', '13.4-inch 2.5K IPS Touchscreen, 120Hz Variable Refresh'],
  ['Processor', 'Intel Core 5 320 (Wildcat Lake), up to 4.6 GHz'],
  ['Memory', '16GB LPDDR5X'],
  ['Storage', '512GB M.2 PCIe Gen 4 NVMe SSD'],
  ['Graphics', 'Intel Xe3 Graphics (2-Core)'],
  ['Battery', '52Wh Li-Po, 65W USB-C Fast Charging'],
  ['Connectivity', 'Intel Wi-Fi 7, Bluetooth 6.0'],
  ['Dimensions', '12.7mm thin, 1.0kg'],
  ['Ports', '2x USB 4.0 Type-C'],
]

export default function SpecsDrawer({ isOpen, onClose, reduced }) {
  const dialog = useRef(null)
  const panel = useRef(null)
  const closeButton = useRef(null)
  const savedOverflow = useRef(null)

  useEffect(() => () => {
    if (savedOverflow.current !== null) document.body.style.overflow = savedOverflow.current
  }, [])

  function handleClosed() {
    if (savedOverflow.current !== null) {
      document.body.style.overflow = savedOverflow.current
      savedOverflow.current = null
    }
    onClose()
  }

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const controls = panel.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  useGSAP(() => {
    const element = dialog.current
    if (isOpen) {
      if (!element.open) {
        savedOverflow.current = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        element.showModal()
      }
      gsap.fromTo(panel.current, { x: '100%' }, { x: 0, duration: reduced ? 0 : 0.65, ease: 'power3.out', overwrite: true })
      closeButton.current.focus({ preventScroll: true })
    } else if (element.open) {
      gsap.to(panel.current, { x: '100%', duration: reduced ? 0 : 0.4, ease: 'power3.inOut', overwrite: true, onComplete: () => element.close() })
    }
  }, { dependencies: [isOpen, reduced] })

  return createPortal(
    <dialog ref={dialog} id="full-specs" className="specs-dialog" aria-labelledby="specs-title" onKeyDown={handleKeyDown} onCancel={(event) => { event.preventDefault(); onClose() }} onClose={handleClosed} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={panel} className="specs-panel fixed w-[400px] h-full top-0 right-0 bg-black/60 backdrop-blur-xl border-l border-white/10 z-50 p-10">
        <div className="specs-header">
          <div><p className="eyebrow">XPS 13 / 2026</p><h2 id="specs-title">Technical specifications</h2></div>
          <button ref={closeButton} className="specs-close" type="button" onClick={onClose} aria-label="Close specifications">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
        </div>
        <dl className="specs-list">
          {specifications.map(([key, value]) => <div className="specs-row" key={key}><dt className="text-white/50 text-sm tracking-widest uppercase">{key}</dt><dd className="text-white text-lg mt-1 mb-4">{value}</dd></div>)}
        </dl>
        <p className="specs-bottom-note">Designed for everything you imagine.</p>
      </section>
      <div className="custom-cursor" aria-hidden="true" />
    </dialog>, document.body,
  )
}



