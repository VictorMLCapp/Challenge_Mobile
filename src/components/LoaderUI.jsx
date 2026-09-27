import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import styles from './LoaderUI.module.css'
import fordLogo from '../assets/Ford-Logo-PNG-Isolated-Image.webp'

export default function LoaderUI() {
  const { active, progress } = useProgress()
  const [mounted, setMounted] = useState(true)
  // If finished loading (or already loaded from cache)
  const done = !active && progress === 100
  const opacity = done ? 0 : 1

  useEffect(() => {
    if (!done) return undefined
    const t = setTimeout(() => setMounted(false), 500) // wait for CSS transition
    return () => clearTimeout(t)
  }, [done])

  if (!mounted) return null

  return (
    <div className={styles.container} style={{ opacity }}>
      <div className={styles.content}>
        <img src={fordLogo} alt="Ford" className={styles.logo} />
        <div className={styles.barBg}>
          <div className={styles.barFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.text}>CARREGANDO... {Math.round(progress)}%</div>
      </div>
    </div>
  )
}
