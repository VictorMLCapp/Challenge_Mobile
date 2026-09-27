import { useRef, useEffect, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { PieChart, Pie, Cell } from 'recharts'
import FordRangerRaptor from './FordRangerRaptor'
import { status, specSections, components, EMPTY_HEADING, EMPTY_BODY, ERROR_MESSAGE, SCORE_DISCLAIMER } from '../data/ranger'
import styles from './SpecsPage.module.css'
import fordLogo from '../assets/Ford-Logo-PNG-Isolated-Image.webp'

// Camera positions & targets for each view
const VIEWS = {
  geral_traseira:  { pos: [0,  1.5, 10],  target: [0, 0, 0], label: 'Traseira' },
  geral_lateral:   { pos: [10, 1.0, 0],   target: [0, 0, 0], label: 'Lateral' },
  geral_frente:    { pos: [0,  1.5, -10], target: [0, 0, 0], label: 'Frente' },
  geral_topo:      { pos: [0,  8,   0],   target: [0, 0, 0], label: 'Topo' },
  motor_frente:    { pos: [0,  2,   7],   target: [0, 1, 0], label: 'Motor' },
  motor_hood:      { pos: [0,  4,   4],   target: [0, 0.5, 0], label: 'Capô' },
  rodas_dianteira: { pos: [-5, 0.4, -4],  target: [-2, -1, -2], label: 'Roda Dianteira' },
  rodas_traseira:  { pos: [5,  0.4, 5],   target: [2, -1, 2], label: 'Roda Traseira' },
  caçamba:         { pos: [-6, 3,  -2],   target: [-1, 0.5, -1], label: 'Caçamba' },
  cockpit:         { pos: [2,  2,   5],   target: [0, 1, 0], label: 'Cockpit' },
}

const NAV_CATEGORIES = [
  {
    id: 'geral',
    label: 'Visão Geral',
    children: ['geral_traseira', 'geral_lateral', 'geral_frente', 'geral_topo'],
  },
  {
    id: 'motor',
    label: 'Motor',
    children: ['motor_frente', 'motor_hood'],
  },
  {
    id: 'rodas',
    label: 'Rodas',
    children: ['rodas_dianteira', 'rodas_traseira'],
  },
  {
    id: 'carroceria',
    label: 'Carroceria',
    children: ['caçamba', 'cockpit'],
  },
]


// Donut chart component
function DonutScore({ score }) {
  const data = [
    { value: score },
    { value: 100 - score },
  ]
  const color = score >= 90 ? '#22d3a5' : score >= 75 ? '#f54b2e' : '#f59e0b'

  return (
    <div className={styles.donutWrap}>
      <PieChart width={90} height={90}>
        <Pie
          data={data}
          cx={45}
          cy={45}
          innerRadius={30}
          outerRadius={42}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="rgba(255,255,255,0.05)" />
        </Pie>
      </PieChart>
      <div className={styles.donutLabel} style={{ color }}>
        <span className={styles.donutScore}>{score}</span>
        <span className={styles.donutUnit}>/100</span>
      </div>
    </div>
  )
}

// Animated Camera Controller
function CameraController({ targetView }) {
  const { camera } = useThree()
  const currentPos = useRef(new THREE.Vector3(...targetView.pos))
  const currentTarget = useRef(new THREE.Vector3(...targetView.target))
  const targetPos = useRef(new THREE.Vector3(...targetView.pos))
  const targetTgt = useRef(new THREE.Vector3(...targetView.target))
  const lookAt = useRef(new THREE.Vector3(...targetView.target))

  useEffect(() => {
    targetPos.current.set(...targetView.pos)
    targetTgt.current.set(...targetView.target)
  }, [targetView])

  useFrame(() => {
    currentPos.current.lerp(targetPos.current, 0.04)
    currentTarget.current.lerp(targetTgt.current, 0.04)
    camera.position.copy(currentPos.current)
    lookAt.current.copy(currentTarget.current)
    camera.lookAt(lookAt.current)
  })

  return null
}

function ComponentDetailPanel({ data }) {
  return (
    <div className={styles.componentDetail}>
      <div className={styles.panelInner}>
        <div className={styles.panelHeader}>
          <h4 className={styles.panelTitle}>{data.title}</h4>
          <DonutScore score={data.score} />
        </div>
        <p className={styles.panelDesc}>{data.description}</p>
        <div className={styles.panelSpecs}>
          {data.specs.map(s => (
            <div key={s.label} className={styles.panelSpecRow}>
              <span className={styles.panelSpecLabel}>{s.label}</span>
              <span className={styles.panelSpecValue}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.panelCompare}>
          <span className={styles.panelCompareLabel}>VS. COMPETIDORES</span>
          {data.comparisons.map(c => (
            <div key={c.id} className={styles.panelCompareRow}>
              <span className={styles.panelCompareName}>{c.name}</span>
              <div className={styles.panelCompareBar}>
                <div
                  className={styles.panelCompareBarFill}
                  style={{
                    width: `${c.value}%`,
                    background: c.id === 'raptor' ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
              <span className={styles.panelCompareScore}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SpecsPage({ onBack, onViewReport, onHome }) {
  const [activeView, setActiveView] = useState('geral_lateral')
  const [openCategory, setOpenCategory] = useState('geral')
  const [activeSection, setActiveSection] = useState(0)
  const [activeComponent, setActiveComponent] = useState(null)

  const view = VIEWS[activeView]
  const selectedComponent = status === 'ok' ? components.find(c => c.id === activeComponent) : null

  function handleCategory(id) {
    setOpenCategory(id === openCategory ? null : id)
  }

  function handleView(viewId) {
    setActiveView(viewId)
  }

  function handleComponentSelect(component) {
    if (activeComponent === component.id) {
      setActiveComponent(null)
      return
    }
    setActiveComponent(component.id)
    if (component.viewId) {
      setActiveView(component.viewId)
      const parentCat = NAV_CATEGORIES.find(cat => cat.children.includes(component.viewId))
      if (parentCat) setOpenCategory(parentCat.id)
    }
  }

  return (
    <div className={styles.page}>
      {/* 3D Canvas */}
      <div className={styles.canvas}>
        <Canvas
          camera={{ position: VIEWS['geral_lateral'].pos, fov: 40, near: 0.1, far: 200 }}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          style={{ background: 'transparent' }}
        >
          <CameraController targetView={view} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 15, 8]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-8, 8, -5]} intensity={0.8} color="#4a7aff" />
          <pointLight position={[0, 6, -8]} intensity={1.2} color="#f54b2e" />
          <Environment files="/hdri/potsdamer_platz_1k.hdr" />
          <Suspense fallback={null}>
            <FordRangerRaptor />
          </Suspense>
          <ContactShadows position={[0, -1.42, 0]} opacity={0.7} scale={20} blur={2.5} far={6} color="#000000" />
          <Grid
            position={[0, -1.42, 0]} args={[30, 30]}
            cellSize={0.8} cellThickness={0.5} cellColor="#1a2535"
            sectionSize={4} sectionThickness={1} sectionColor="#1e2f45"
            fadeDistance={25} fadeStrength={1} infiniteGrid
          />
        </Canvas>
      </div>

      {/* Component Explorer */}
      <aside className={styles.componentExplorer}>
        {status === 'ok' && (
          <>
            <div className={styles.explorerLabel}>COMPONENTES</div>
            <p className={styles.explorerHint}>Selecione para ver specs e comparar</p>
            <div className={styles.explorerList}>
              {components.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.explorerItem} ${activeComponent === c.id ? styles.explorerItemActive : ''}`}
                  onClick={() => handleComponentSelect(c)}
                >
                  <span className={styles.explorerIcon}>{c.icon}</span>
                  <div className={styles.explorerMeta}>
                    <span className={styles.explorerName}>{c.title}</span>
                    <span className={styles.explorerScore}>{c.score}/100</span>
                  </div>
                  <span className={styles.explorerChevron}>{activeComponent === c.id ? '▲' : '›'}</span>
                </button>
              ))}
            </div>
            {selectedComponent && <ComponentDetailPanel data={selectedComponent} />}
            <p>{SCORE_DISCLAIMER}</p>
          </>
        )}
        {status === 'empty' && (
          <>
            <h2 className="emptyHeading">{EMPTY_HEADING}</h2>
            <p className="emptyBody">{EMPTY_BODY}</p>
          </>
        )}
        {status === 'error' && (
          <p className="emptyBody">{ERROR_MESSAGE}</p>
        )}
      </aside>

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.logo} onClick={onHome}>
          <img src={fordLogo} alt="Ford" className={styles.logoImg} />
        </button>
        <nav className={styles.nav}>
          <button className={styles.backBtn} onClick={onBack}>← Voltar</button>
          <span className={styles.navTitle}>Ford Vision · Especificações</span>
          {onViewReport && (
            <button className={styles.reportBtn} onClick={onViewReport}>Relatório</button>
          )}
        </nav>
      </header>

      {/* Camera Nav (cascade buttons) */}
      <div className={styles.camNav}>
        <div className={styles.camNavLabel}>EXPLORAR</div>
        {NAV_CATEGORIES.map(cat => (
          <div key={cat.id} className={styles.camCategoryWrap}>
            <button
              className={`${styles.camCategory} ${openCategory === cat.id ? styles.camCategoryActive : ''}`}
              onClick={() => handleCategory(cat.id)}
            >
              {cat.label}
              <span className={styles.chevron}>{openCategory === cat.id ? '▲' : '▼'}</span>
            </button>
            {openCategory === cat.id && (
              <div className={styles.camChildren}>
                {cat.children.map((viewId, i) => (
                  <button
                    key={viewId}
                    className={`${styles.camChild} ${activeView === viewId ? styles.camChildActive : ''}`}
                    onClick={() => handleView(viewId)}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {VIEWS[viewId].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Specs Panel */}
      <div className={styles.specsPanel}>
        {status === 'ok' && (
          <>
            <div className={styles.specsTabs}>
              {specSections.map((sec, i) => (
                <button
                  key={sec.section}
                  className={`${styles.specsTab} ${activeSection === i ? styles.specsTabActive : ''}`}
                  onClick={() => setActiveSection(i)}
                >
                  {sec.section}
                </button>
              ))}
            </div>
            <div className={styles.specsTable}>
              {specSections[activeSection].items.map(item => (
                <div key={item.label} className={styles.specsRow}>
                  <span className={styles.specsRowLabel}>{item.label}</span>
                  <span className={styles.specsRowValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {status === 'empty' && (
          <>
            <h2 className="emptyHeading">{EMPTY_HEADING}</h2>
            <p className="emptyBody">{EMPTY_BODY}</p>
          </>
        )}
        {status === 'error' && (
          <p className="emptyBody">{ERROR_MESSAGE}</p>
        )}
      </div>

      {/* View Label overlay */}
      <div className={styles.viewLabel}>
        {VIEWS[activeView].label}
      </div>
    </div>
  )
}
