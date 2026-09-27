import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import FordRangerRaptor from './FordRangerRaptor'

function LoadingFallback() {
  return null
}

export default function CarViewer() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [4, 0.2, 8], fov: 40, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 15, 8]}
          intensity={2.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-8, 8, -5]} intensity={0.8} color="#4a7aff" />
        <pointLight position={[0, 6, -8]} intensity={1.2} color="#f54b2e" />
        <spotLight
          position={[-4, 10, 4]}
          angle={0.4}
          penumbra={0.8}
          intensity={1.5}
          castShadow
          color="#ffffff"
        />

        {/* Environment */}
        <Environment files="/hdri/potsdamer_platz_1k.hdr" />

        {/* Car Model */}
        <Suspense fallback={<LoadingFallback />}>
          <FordRangerRaptor />
        </Suspense>

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -1.42, 0]}
          opacity={0.7}
          scale={20}
          blur={2.5}
          far={6}
          color="#000000"
        />

        {/* Grid floor */}
        <Grid
          position={[0, -1.42, 0]}
          args={[30, 30]}
          cellSize={0.8}
          cellThickness={0.5}
          cellColor="#1a2535"
          sectionSize={4}
          sectionThickness={1}
          sectionColor="#1e2f45"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Controls */}
        <OrbitControls
          target={[0, 0, 0]}
          minDistance={4}
          maxDistance={12}
          enablePan={false}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
          enableDamping
          dampingFactor={0.05}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
