import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

const BENGALURU = [12.9716, 77.5946]
// Where people move to Bengaluru from; drawn as arcs landing on the city.
const CITIES = [
  [19.076, 72.8777], // Mumbai
  [28.6139, 77.209], // Delhi
  [17.385, 78.4867], // Hyderabad
  [13.0827, 80.2707], // Chennai
  [18.5204, 73.8567], // Pune
  [22.5726, 88.3639], // Kolkata
]
// cobe's angle for a longitude so that it faces the viewer.
const phiFor = (lon) => Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2)

// A slowly turning dotted globe, centred on India at first. Drag to spin it.
// cobe v2 has no render callback, so we drive rotation ourselves with requestAnimationFrame.
export default function Globe({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let size = canvas.offsetWidth

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: phiFor(BENGALURU[1]),
      theta: 0.22,
      // A white globe with soft grey land dots, set on the black hero.
      dark: 0,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 5,
      mapBaseBrightness: 0,
      baseColor: [1, 1, 1],
      markerColor: [0.12, 0.31, 1],
      glowColor: [0.55, 0.62, 0.8],
      markers: [
        { location: BENGALURU, size: 0.075 },
        ...CITIES.map((c) => ({ location: c, size: 0.022, color: [0.05, 0.07, 0.13] })),
      ],
      arcs: CITIES.map((c) => ({ from: c, to: BENGALURU })),
      arcColor: [0.12, 0.31, 1],
      arcWidth: 0.55,
      arcHeight: 0.22,
      markerElevation: 0.01,
      opacity: 1,
    })

    let phi = phiFor(BENGALURU[1])
    let dragX = null
    let dragOffset = 0
    let velocity = 0
    let visible = true
    let frame

    const tick = () => {
      if (visible) {
        if (dragX === null) {
          // Ease drag momentum away, then keep a slow drift.
          velocity *= 0.94
          phi += (reduceMotion ? 0 : 0.0016) + velocity
        }
        globe.update({ phi: phi + dragOffset })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const onDown = (e) => {
      dragX = e.clientX
      canvas.setPointerCapture?.(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (dragX === null) return
      const delta = (e.clientX - dragX) / 200
      dragOffset += delta
      velocity = delta * 0.15
      dragX = e.clientX
    }
    const onUp = () => {
      dragX = null
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    // Stop drawing while the globe is off screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    const onResize = () => {
      size = canvas.offsetWidth
      globe.update({ width: size * dpr, height: size * dpr })
    }
    window.addEventListener('resize', onResize)

    // Fade in once the first frame is drawn.
    requestAnimationFrame(() => {
      canvas.style.opacity = '1'
    })

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('resize', onResize)
      globe.destroy()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`aspect-square w-full cursor-grab opacity-0 transition-opacity duration-[1.4s] ease-out [contain:layout_paint_size] ${className}`}
      aria-label="A turning globe with arcs from Indian cities to Bengaluru"
      role="img"
    />
  )
}
