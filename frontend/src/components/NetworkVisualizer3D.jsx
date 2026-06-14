/**
 * NetworkVisualizer3D.jsx
 * Immersive Three.js / React-Three-Fiber 3D network simulation canvas.
 * Replaces the flat SVG canvas with glowing nodes, animated packet spheres,
 * attack/defense particle effects, and a slowly auto-orbiting camera.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Box, Float, Stars } from '@react-three/drei'
import * as THREE from 'three'
import StatusPill from './StatusPill'
import { ShieldCheck } from 'lucide-react'

// ─── Node definitions per scenario ───────────────────────────────────────────
function getNodeLayout(scenario, defenseEnabled) {
  const defaults = [
    { id: 'client',   pos: [-4, 1.5, 0],  color: '#3B82F6', label: 'Client',    sub: 'tx request',      shape: 'box' },
    { id: 'attacker', pos: [0, -1.5, 2],  color: '#EF4444', label: 'Attacker',  sub: 'intercept node',  shape: 'sphere' },
    { id: 'server',   pos: [4, 1.5, 0],   color: defenseEnabled ? '#22C55E' : '#F59E0B', label: 'Gateway', sub: 'packet relay', shape: 'box' },
    { id: 'defense',  pos: [4, -1, -2],   color: '#22C55E', label: 'Firewall',  sub: 'defense layer',   shape: 'sphere' },
  ]

  const id = scenario?.id
  if (id === 'password-bruteforce') {
    return [
      { id: 'operator', pos: [-4, 1.5, 0], color: '#3B82F6', label: 'Operator', sub: 'student_operator', shape: 'box' },
      { id: 'auth',     pos: [4, 1.5, 0],  color: '#22C55E', label: 'Auth Server', sub: 'password hash', shape: 'box' },
      { id: 'attacker', pos: [0, -1.5, 2], color: '#EF4444', label: 'Attacker',  sub: 'dictionary',     shape: 'sphere' },
      { id: 'lockout',  pos: [4, -1, -2],  color: defenseEnabled ? '#22C55E' : '#6B7280', label: 'Lockout', sub: 'defense', shape: 'sphere' },
    ]
  }
  if (id === 'packet-sniffing') {
    return [
      { id: 'client', pos: [-4, 1.5, 0],  color: '#3B82F6', label: 'Client',  sub: 'mail/file/API', shape: 'box' },
      { id: 'switch', pos: [4, 1.5, 0],   color: '#3B82F6', label: 'Switch',  sub: 'shared segment', shape: 'box' },
      { id: 'sniffer',pos: [0, -1.5, 2],  color: '#EF4444', label: 'Sniffer', sub: 'capture', shape: 'sphere' },
      { id: 'tls',    pos: [4, -1, -2],   color: defenseEnabled ? '#22C55E' : '#6B7280', label: 'TLS', sub: 'encryption', shape: 'sphere' },
    ]
  }
  if (id === 'replay-attack') {
    return [
      { id: 'client', pos: [-4, 1.5, 0],  color: '#3B82F6', label: 'Client',  sub: 'original req', shape: 'box' },
      { id: 'gateway',pos: [4, 1.5, 0],   color: '#22C55E', label: 'Payment', sub: 'transaction', shape: 'box' },
      { id: 'replay', pos: [0, -1.5, 2],  color: '#EF4444', label: 'Replay',  sub: 'captured token', shape: 'sphere' },
      { id: 'nonce',  pos: [4, -1, -2],   color: defenseEnabled ? '#22C55E' : '#6B7280', label: 'Nonce', sub: 'dup detect', shape: 'sphere' },
    ]
  }
  return defaults
}

// ─── Connection lines ─────────────────────────────────────────────────────────
function ConnectionLines({ nodes, defenseEnabled }) {
  const lineColor = defenseEnabled ? '#22C55E' : '#EF4444'
  const dashColor = '#1e293b'

  const lines = useMemo(() => {
    if (nodes.length < 3) return []
    return [
      [nodes[0].pos, nodes[2].pos],  // client → server
      [nodes[0].pos, nodes[1].pos],  // client → attacker
      [nodes[1].pos, nodes[2].pos],  // attacker → server
      [nodes[1].pos, nodes[3].pos],  // attacker → defense
    ]
  }, [nodes])

  return (
    <>
      {lines.map((pair, i) => {
        const points = pair.map((p) => new THREE.Vector3(...p))
        const geo = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial
              color={i === 0 ? lineColor : i === 3 ? '#22C55E' : '#334155'}
              transparent
              opacity={0.6}
              linewidth={2}
            />
          </line>
        )
      })}
    </>
  )
}

// ─── 3D Node ──────────────────────────────────────────────────────────────────
function NetworkNode({ pos, color, label, sub, shape, isDefending }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.005
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + 0.1 * Math.sin(state.clock.elapsedTime * 2)
    }
    // Defense shield pulse
    if (isDefending && meshRef.current) {
      meshRef.current.scale.setScalar(1 + 0.04 * Math.sin(state.clock.elapsedTime * 3))
    }
  })

  const size = hovered ? 0.45 : 0.38
  const glowSize = size * 1.9

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group position={new THREE.Vector3(...pos)}>
        {/* Glow halo */}
        <Sphere args={[glowSize, 16, 16]} ref={glowRef}>
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
        </Sphere>

        {/* Main node */}
        {shape === 'sphere' ? (
          <Sphere
            args={[size, 24, 24]}
            ref={meshRef}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 0.9 : 0.4}
              roughness={0.3}
              metalness={0.6}
            />
          </Sphere>
        ) : (
          <Box
            args={[size * 1.4, size * 1.4, size * 1.4]}
            ref={meshRef}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 0.9 : 0.4}
              roughness={0.2}
              metalness={0.7}
            />
          </Box>
        )}

        {/* Point light */}
        <pointLight color={color} intensity={hovered ? 2 : 0.8} distance={3} />

        {/* Label */}
        <Text
          position={[0, -0.75, 0]}
          fontSize={0.22}
          color="#e2e8f0"
          font={undefined}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#0a0f1e"
        >
          {label}
        </Text>
        <Text
          position={[0, -1.02, 0]}
          fontSize={0.14}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#0a0f1e"
        >
          {sub}
        </Text>
      </group>
    </Float>
  )
}

// ─── Animated packet sphere ───────────────────────────────────────────────────
function PacketSphere({ from, to, speed = 1, color, launched }) {
  const meshRef = useRef()
  const tRef = useRef(Math.random())

  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    mid.y += 1.2
    return new THREE.CatmullRomCurve3([a, mid, b])
  }, [from, to])

  useFrame((_, delta) => {
    if (!launched || !meshRef.current) return
    tRef.current = (tRef.current + delta * speed * 0.18) % 1
    const point = curve.getPoint(tRef.current)
    meshRef.current.position.copy(point)
  })

  if (!launched) return null

  return (
    <Sphere args={[0.12, 12, 12]} ref={meshRef}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.8}
        roughness={0}
        metalness={0.5}
      />
    </Sphere>
  )
}

// ─── Defense shield dome ──────────────────────────────────────────────────────
function ShieldDome({ serverPos, visible }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current) return
    const pulse = Math.sin(state.clock.elapsedTime * 2.5) * 0.1
    meshRef.current.material.opacity = visible ? 0.18 + pulse : 0
    meshRef.current.scale.setScalar(visible ? 1 + pulse * 0.2 : 1)
  })

  return (
    <Sphere args={[1.6, 32, 32]} position={new THREE.Vector3(...serverPos)} ref={meshRef}>
      <meshStandardMaterial
        color="#22C55E"
        emissive="#22C55E"
        emissiveIntensity={0.4}
        transparent
        opacity={0}
        side={THREE.BackSide}
        wireframe={false}
      />
    </Sphere>
  )
}

// ─── Ambient scene ────────────────────────────────────────────────────────────
function Scene({ nodes, defenseEnabled, launched }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }, [gl])

  const serverNode = nodes.find((n) => ['server', 'gateway', 'auth', 'switch'].includes(n.id))
  const clientNode = nodes[0]
  const attackerNode = nodes.find((n) => n.id === 'attacker' || n.id === 'sniffer' || n.id === 'replay')
  const defenseNode = nodes[nodes.length - 1]

  return (
    <>
      <Stars radius={30} depth={50} count={800} factor={3} saturation={0} fade speed={0.4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 8, 0]} intensity={0.4} color="#3B82F6" />

      <ConnectionLines nodes={nodes} defenseEnabled={defenseEnabled} />

      {nodes.map((node) => (
        <NetworkNode key={node.id} {...node} isDefending={defenseEnabled && node.id !== 'attacker' && node.id !== 'sniffer' && node.id !== 'replay'} />
      ))}

      {/* Packet flowing from client to server */}
      {clientNode && serverNode && (
        <PacketSphere
          from={clientNode.pos}
          to={serverNode.pos}
          color={defenseEnabled ? '#22C55E' : '#3B82F6'}
          speed={1.2}
          launched={launched}
        />
      )}

      {/* Malicious packet from attacker to server */}
      {attackerNode && serverNode && (
        <PacketSphere
          from={attackerNode.pos}
          to={serverNode.pos}
          color="#EF4444"
          speed={0.9}
          launched={launched}
        />
      )}

      {/* Defense shield dome around server */}
      {serverNode && (
        <ShieldDome serverPos={serverNode.pos} visible={defenseEnabled} />
      )}

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enablePan={false}
        enableZoom={true}
        minDistance={6}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.75}
        minPolarAngle={Math.PI * 0.15}
      />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function NetworkVisualizer3D({ defenseEnabled, launched, packets = [], scenario, channel }) {
  const nodes = useMemo(
    () => getNodeLayout(scenario, defenseEnabled),
    [scenario, defenseEnabled],
  )

  const interceptedPacket = packets.find((p) => p.intercepted)
  const channelLabel = channel?.label ?? (defenseEnabled ? 'Encrypted Channel' : 'Plaintext Channel')
  const channelStatus = channel?.status ?? (defenseEnabled ? 'Protected' : 'Exposed')
  const channelDetail = interceptedPacket?.payload_preview ?? channel?.algorithm ?? (defenseEnabled ? 'Payload encrypted before transit' : 'Payload readable in transit')
  const statusTone = ['protected', 'locked', 'monitoring', 'rejected', 'standby'].includes(channelStatus) ? 'green' : 'red'

  return (
    <div className="relative w-full min-h-[420px] overflow-hidden rounded-lg border border-cyber-border bg-[#050810]">
      <Canvas
        camera={{ position: [0, 2, 12], fov: 60 }}
        style={{ background: 'transparent', width: '100%', height: '100%', minHeight: 420 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene nodes={nodes} defenseEnabled={defenseEnabled} launched={launched} />
      </Canvas>

      {/* Grid overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 65%)',
        }}
      />

      {/* Channel status overlay (bottom) */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyber-border bg-cyber-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <ShieldCheck className={defenseEnabled ? 'h-5 w-5 text-cyber-green' : 'h-5 w-5 text-cyber-muted'} />
          <div>
            <p className="text-sm font-semibold text-cyber-text">{channelLabel}</p>
            <p className="max-w-xs truncate text-xs text-cyber-muted">{channelDetail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cyber-blue/10 border border-cyber-blue/20 px-2 py-0.5 text-[10px] font-semibold text-cyber-blue">
            3D Live
          </span>
          <StatusPill tone={statusTone}>{channelStatus}</StatusPill>
        </div>
      </div>
    </div>
  )
}
