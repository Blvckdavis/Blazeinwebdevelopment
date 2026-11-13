import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import CustomCursor from './components/CustomCursor'
import SceneBoundary from './components/SceneBoundary'
import SpecsDrawer from './components/SpecsDrawer'
import './App.css'

const LiquidMetalScene = lazy(() => import('./components/LiquidMetalScene'))

gsap.registerPlugin(ScrollTrigger, useGSAP)

const features = [
  { id: 'craft', number: '01', title: 'Featherweight craft', metric: '12.7', unit: 'mm thin', text: 'At just 12.7mm thin and 1kg, this CNC-milled aluminum wonder pushes the absolute boundaries of portability.' },
  { id: 'performance', number: '02', title: 'Performance ecosystem', metric: 'Intel®', unit: 'Core 5 320', text: 'Engineered with Intel Core 5 320 to run workflows coolly and silently with advanced dual-fan thermals.' },
  { id: 'design', number: '03', title: 'Intuitive design', metric: '120', unit: 'Hz. Effortlessly fluid.', text: '13.4-inch InfinityEdge 120Hz display with an invisible glass trackpad.' },
]
const glass = 'bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl'

function Arrow({ down = false }) {
  return <svg className={down ? 'arrow arrow-down' : 'arrow'} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.3" /></svg>
}

function App() {
  const root = useRef(null)
  const video = useRef(null)
  const scrollProgress = useRef(0)
  const [isSpecsOpen, setIsSpecsOpen] = useState(false)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [mediaState, setMediaState] = useState('loading')
  const [scene, setScene] = useState(0)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setReduced(query.matches); setPaused(query.matches) }
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = video.current
    const syncPlayback = () => {
      if (paused || document.hidden || reduced) element.pause()
      else element.play().catch(() => setPaused(true))
    }
    syncPlayback()
    element.addEventListener('canplay', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    return () => {
      element.removeEventListener('canplay', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
    }
  }, [paused, reduced])

  useGSAP(() => {
    const media = gsap.matchMedia()
    ScrollTrigger.create({
      trigger: '.scroll-story', start: 'top top', end: 'bottom bottom',
      onUpdate: ({ progress }) => {
        scrollProgress.current = progress
        gsap.set('.progress-fill', { scaleX: progress })
        setScene(progress < 0.36 ? 0 : progress < 0.8 ? 1 : 2)
      },
    })
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.site-header', { y: -16, opacity: 0, duration: 1.1, ease: 'power2.out' })
      gsap.fromTo('.hero-letter', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.05, delay: 0.2, ease: 'power3.out' })
      gsap.from('.hero-reveal', { y: 24, opacity: 0, duration: 1.2, stagger: 0.12, delay: 0.15, ease: 'power3.out' })
      gsap.to('.hero-copy', {
        y: -45, autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: '.intro', start: 'top top', end: '55% top', scrub: true },
      })
      const depth = gsap.timeline({ scrollTrigger: { trigger: '.scroll-story', start: 'top top', end: 'bottom bottom', scrub: 0.7 } })
      depth.fromTo('.video-stage', { scale: 1.01, yPercent: 0 }, { scale: 1.12, yPercent: -3, ease: 'none' }, 0)
      depth.fromTo(video.current, { playbackRate: 0.65 }, { playbackRate: 1.3, ease: 'none' }, 0)
      gsap.utils.toArray('.feature-card').forEach((card) => {
        gsap.from(card, { y: 42, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: card, start: 'top 91%', end: 'top 65%', scrub: 0.45 } })
      })
      gsap.from('.finale-panel', { y: 42, opacity: 0, scale: 0.97, scrollTrigger: { trigger: '.finale', start: 'top 88%', end: 'top 28%', scrub: 0.6 } })
    })
    return () => media.revert()
  }, { scope: root })

  function onVideoReady() {
    setMediaState('ready')
    // Begin on the product reveal; the full supplied film continues and loops.
    video.current.currentTime = video.current.duration * 0.52
  }

  return (
    <div ref={root} className="experience bg-[radial-gradient(circle_at_center,_#1c1d24_0%,_#0a0b0e_100%)]">
      <a className="skip-link" href="#features">Skip to features</a>
      <div className="video-stage fixed inset-0 z-0" aria-hidden="true">
        <img className="video-poster" src="/dell-xps-poster.jpg" alt="" />
        <video ref={video} src="/dell-xps-explosion.mp4" poster="/dell-xps-poster.jpg" autoPlay={!paused && !reduced} loop muted playsInline preload="metadata" className={`fixed top-0 left-0 w-full h-full object-cover z-0 ${mediaState === 'ready' ? 'is-ready' : ''}`} onLoadedMetadata={onVideoReady} onError={() => setMediaState('error')} />
      </div>
      {!reduced && <SceneBoundary><Suspense fallback={null}><LiquidMetalScene progress={scrollProgress} paused={paused || isSpecsOpen || mediaState === 'error'} /></Suspense></SceneBoundary>}
      <div className="cinematic-mask fixed inset-0 bg-black/40 z-10 pointer-events-none" />
      <header className="site-header fixed z-40">
        <a className="brand" href="#overview" aria-label="Dell XPS 13 home"><span className="dell-mark">DELL</span><span className="brand-divider" /><span className="xps-mark">XPS</span></a>
        <nav className="main-nav" aria-label="Product navigation">
          <a href="#overview" aria-current={scene === 0 ? 'location' : undefined}>Overview</a>
          <a href="#craft">Craftsmanship</a>
          <a href="#performance">Performance</a>
        </nav>
        <a className="nav-buy" href="#buy">Explore XPS 13 <Arrow /></a>
      </header>

      <aside className="chapter-nav fixed z-30" aria-label="Page chapters">
        {['overview', 'features', 'buy'].map((id, index) => <a key={id} href={`#${id}`} className={scene === index ? 'is-active' : ''} aria-label={`${['Introduction', 'Engineering', 'Buy XPS 13'][index]} chapter`} aria-current={scene === index ? 'location' : undefined}><span className="chapter-label">0{index + 1}</span><span className="chapter-line" /></a>)}
      </aside>

      <main className="scroll-story relative z-20 h-[300vh]">
        <section id="overview" className="intro story-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow hero-reveal"><span className="status-dot" /> THE NEW XPS 13 <span className="edition">2026 EDITION</span></div>
            <h1 id="hero-title" aria-label="DELL XPS 13">{Array.from('DELL XPS 13').map((letter, index) => <span key={index} className="hero-letter" aria-hidden="true">{letter === ' ' ? '\u00a0' : letter}</span>)}</h1>
            <p className="hero-tagline hero-reveal">CRAFTED FOR THE<br />EXTRAORDINARY.</p>
            <div className={`hero-note hero-reveal ${glass}`}>
              <span className="note-line" />
              <p>Less to carry.<br /><span>More to create.</span></p>
              <span className="note-detail">Precision in every detail.<br />Possibility in every moment.</span>
            </div>
            <a className="explore-link hero-reveal" href="#features">Discover the extraordinary <span className="arrow-circle"><Arrow down /></span></a>
          </div>
          <div className="hero-specs">
            <div><span>12.7<span className="spec-unit">mm</span></span><p>IMPOSSIBLY THIN</p></div>
            <div><span>1<span className="spec-unit">kg</span></span><p>EXCEPTIONALLY LIGHT</p></div>
            <div><span>120<span className="spec-unit">Hz</span></span><p>INFINITELY IMMERSIVE</p></div>
          </div>
          <div className="film-caption"><span className="tiny-cross">+</span> A STUDY IN PRECISION<span>DESIGNED TO MOVE YOU.</span></div>
        </section>

        <section id="features" className="features story-section" aria-label="Precision engineering">
          <div className="feature-stack">
            {features.map((feature) => <article key={feature.id} id={feature.id} className={`feature-card ${glass}`}>
              <div className="feature-topline"><span>{feature.number} /</span><h2>{feature.title}</h2><span className="feature-cross">+</span></div>
              <div className="feature-metric">{feature.metric}<span>{feature.unit}</span></div>
              <p>{feature.text}</p>
            </article>)}
          </div>
          <p className="engineering-caption">NOTHING EXCESS.<br /><span>Everything exceptional.</span></p>
        </section>

        <section id="buy" className="finale story-section" aria-labelledby="finale-title">
          <div className={`finale-panel ${glass}`}>
            <p className="eyebrow">YOUR NEXT EXTRAORDINARY</p>
            <h2 id="finale-title">Small in size.<br /><span>Boundless in possibility.</span></h2>
            <p className="finale-description">Meet the XPS 13. Built to go wherever your ambition takes you.</p>
            <div className="finale-actions">
              <a className="buy-button" href="https://www.dell.com/en-us/shop/laptops/sr/laptops/xps-laptops">BUY XPS 13 <Arrow /></a>
              <button className="specs-button" type="button" aria-haspopup="dialog" aria-controls="full-specs" aria-expanded={isSpecsOpen} onClick={() => setIsSpecsOpen(true)}>View Full Specs <span aria-hidden="true">+</span></button>
            </div>
            <p className="price">Starts at <strong>$739.99</strong></p>
            <p className="configuration">16GB LPDDR5X <span>/</span> 512GB SSD</p>
            <span className="finale-rule" />
            <p className="finale-footnote">Precision crafted. Exceptionally XPS.</p>
          </div>
        </section>
      </main>

      <footer className="experience-bar fixed z-40">
        <div className="progress-track"><span className="progress-fill" /></div>
        <span className="current-chapter"><span>0{scene + 1}</span> / {['INTRODUCTION', 'THE ENGINEERING', 'YOUR NEXT XPS'][scene]}</span>
        <a className="scroll-prompt" href={scene === 2 ? '#overview' : '#features'}>{scene === 2 ? 'BACK TO THE BEGINNING' : 'SCROLL TO EXPLORE'} <Arrow down /></a>
        <button className="motion-toggle" onClick={() => setPaused(!paused)} disabled={reduced || mediaState === 'error'} aria-label={reduced ? 'Motion disabled by system preference' : paused ? 'Play background video' : 'Pause background video'} aria-pressed={paused}>
          <span>{mediaState === 'error' ? 'STILL EXPERIENCE' : reduced ? 'REDUCED MOTION' : paused ? 'PLAY FILM' : 'PAUSE FILM'}</span>
          {paused ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5Z" fill="currentColor" /></svg> : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" /></svg>}
        </button>
      </footer>
      <SpecsDrawer isOpen={isSpecsOpen} onClose={() => setIsSpecsOpen(false)} reduced={reduced} />
      <CustomCursor />
      <div className="sr-only" role="status">{mediaState === 'error' ? 'Background film unavailable. All product information is available below.' : ''}</div>
    </div>
  )
}

export default App



