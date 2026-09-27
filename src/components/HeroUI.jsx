import { useState, useEffect } from 'react'
import { status, homeFacts, EMPTY_HEADING, EMPTY_BODY, ERROR_MESSAGE } from '../data/ranger'
import styles from './HeroUI.module.css'
import fordLogo from '../assets/Ford-Logo-PNG-Isolated-Image.webp'

export default function HeroUI({ onViewSpecs, onViewReport, onHome }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${styles.ui} ${visible ? styles.visible : ''}`}>

      <header className={styles.header}>
        <button className={styles.logo} onClick={onHome}>
          <img src={fordLogo} alt="Ford Logo" className={styles.logoImg} />
        </button>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Modelos</a>
          <a href="#" className={styles.navLink}>Configurar</a>
          <a href="#" className={styles.navLink}>Dealer</a>
          <button className={styles.ctaSmall}>Solicitar Proposta</button>
        </nav>
      </header>

      <div className={styles.leftPanel}>
        <p className={styles.eyebrow}>Ford Vision™</p>
        <h1 className={styles.title}>
          <span className={styles.titleF}>Ranger</span>
          <span className={styles.titleSub}>Raptor</span>
        </h1>
        <p className={styles.description}>
          A pickup mais capaz fora de estrada. Design agressivo,
          suspensão Fox Racing e tecnologia de última geração para
          dominar qualquer terreno.
        </p>

        {status === 'ok' && (
          <div className={styles.specsGrid}>
            {homeFacts.map((fact) => (
              <div key={fact.label} className={styles.specItem}>
                <span className={styles.specValue}>{fact.value}</span>
                <span className={styles.specLabel}>{fact.label}</span>
              </div>
            ))}
          </div>
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

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onViewSpecs}>Ver Specs</button>
          <button className={styles.btnSecondary} onClick={onViewReport}>Relatório</button>
        </div>
      </div>

      <div className={styles.hint}>
        <div className={styles.hintIcon}>⟳</div>
        <span>Arraste para explorar o veículo</span>
      </div>

      <div className={styles.badge}>
        <span className={styles.badgeYear}>2026</span>
        <div className={styles.badgeLine} />
        <span className={styles.badgeText}>SÉRIE<br/>ESPECIAL</span>
      </div>

    </div>
  )
}
