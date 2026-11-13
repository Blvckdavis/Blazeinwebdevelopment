import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Icosahedron, MeshDistortMaterial } from '@react-three/drei'
import { CanvasTexture, EquirectangularReflectionMapping, MathUtils, SRGBColorSpace } from 'three'

const droplets = [
  { anchor: [0.25, 0.24], radius: 0.48, phase: 0 },
  { anchor: [0.40, -0.02], radius: 0.22, phase: 2.1 },
  { anchor: [0.30, -0.29], radius: 0.32, phase: 4.2 },
]

function LiquidDroplet({ anchor, radius, phase, progress, active }) {
  const mesh = useRef(null)
  const material = useRef(null)
  const time = useRef(phase * 2)
  const { viewport } = useThree()

  // Run after Drei's material update so pause/resume preserves distortion time.
  useFrame((_, delta) => {
    if (active) time.current += Math.min(delta, 0.05)
    material.current.time = time.current * 0.7
    if (!active) return
    const scroll = progress.current
    const smoothing = 1 - Math.exp(-delta * 3)
    mesh.current.rotation.y = MathUtils.lerp(mesh.current.rotation.y, phase + scroll * Math.PI * 0.7, smoothing)
    mesh.current.rotation.x = MathUtils.lerp(mesh.current.rotation.x, scroll * 0.5, smoothing)
    mesh.current.position.y = anchor[1] * viewport.height + Math.sin(time.current * 0.35 + phase) * 0.08 - scroll * 0.22
  })

  return (
    <Icosahedron ref={mesh} args={[radius, 5]} position={[anchor[0] * viewport.width, anchor[1] * viewport.height, 0]} rotation={[0, phase, 0]}>
      <MeshDistortMaterial ref={material} color="#c4ccd6" metalness={1} roughness={0.1} distort={0.4} speed={0} envMapIntensity={1.5} />
    </Icosahedron>
  )
}

function StudioReflections() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#d4dce5')
    gradient.addColorStop(0.3, '#778494')
    gradient.addColorStop(0.5, '#262f3c')
    gradient.addColorStop(0.65, '#abb6c6')
    gradient.addColorStop(1, '#3d4655')
    context.fillStyle = gradient
    context.fillRect(0, 0, 512, 256)
    context.fillStyle = '#edf2fa'
    context.fillRect(65, 30, 18, 130)
    context.fillRect(330, 15, 55, 100)
    const map = new CanvasTexture(canvas)
    map.mapping = EquirectangularReflectionMapping
    map.colorSpace = SRGBColorSpace
    return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <Environment map={texture} />
}

function ContextGuard({ onLost }) {
  const { gl } = useThree()
  useEffect(() => {
    const handleLost = (event) => { event.preventDefault(); onLost() }
    gl.domElement.addEventListener('webglcontextlost', handleLost)
    return () => gl.domElement.removeEventListener('webglcontextlost', handleLost)
  }, [gl, onLost])
  return null
}

export default function LiquidMetalScene({ progress, paused }) {
  const [hidden, setHidden] = useState(document.hidden)
  const [lost, setLost] = useState(false)
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  const active = !paused && !hidden
  return (
    <div className="liquid-metal-layer" aria-hidden="true" data-motion={active ? 'running' : 'paused'}>

        {!lost && <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} frameloop={active ? 'always' : 'demand'} fallback={<span />}>
          <ContextGuard onLost={() => setLost(true)} />
          <ambientLight intensity={0.2} />
          <StudioReflections />
          {droplets.map((droplet) => <LiquidDroplet key={droplet.phase} {...droplet} progress={progress} active={active} />)}
        </Canvas>}

    </div>
  )
}




