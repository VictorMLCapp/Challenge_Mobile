import { useEffect, useRef, useState } from 'react'
import { App as NativeApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import CarViewer from './components/CarViewer'
import HeroUI from './components/HeroUI'
import LoaderUI from './components/LoaderUI'
import SpecsPage from './components/SpecsPage'
import ReportPage from './components/ReportPage'
import LoginPage from './components/LoginPage'
import SearchPage from './components/SearchPage'
import ModelErrorBoundary from './components/ModelErrorBoundary'
import { api } from './services/api'
import { clearSession, loadSession } from './services/session'
import { reportEvent } from './services/telemetry'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'specs' | 'report' | 'login' | 'search'
  const [session, setSession] = useState(null)
  const pageRef = useRef(page)

  useEffect(() => {
    pageRef.current = page
  }, [page])

  useEffect(() => {
    reportEvent('APP_START')
    loadSession().then(setSession)
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined
    const handle = NativeApp.addListener('backButton', () => {
      const current = pageRef.current
      if (current === 'report') setPage('specs')
      else if (current === 'specs' || current === 'login' || current === 'search') setPage('home')
      else NativeApp.exitApp()
    })
    return () => {
      handle.then((listener) => listener.remove())
    }
  }, [])

  function openIntel() {
    setPage(session ? 'search' : 'login')
  }

  async function logout() {
    if (session) await api.logout(session.accessToken).catch(() => {})
    clearSession()
    setSession(null)
    setPage('home')
  }

  function sessionExpired() {
    reportEvent('SESSION_EXPIRED', 'search')
    clearSession()
    setSession(null)
    setPage('login')
  }

  return (
    <div className="app">
      {page === 'home' && (
        <>
          <LoaderUI />
          <ModelErrorBoundary screen="home">
            <CarViewer />
          </ModelErrorBoundary>
          <HeroUI onViewSpecs={() => setPage('specs')} onViewReport={() => setPage('report')} onViewIntel={openIntel} onHome={() => setPage('home')} />
        </>
      )}
      {page === 'specs' && (
        <SpecsPage onBack={() => setPage('home')} onViewReport={() => setPage('report')} onHome={() => setPage('home')} />
      )}
      {page === 'report' && (
        <ReportPage onBack={() => setPage('specs')} onHome={() => setPage('home')} />
      )}
      {page === 'login' && (
        <LoginPage onBack={() => setPage('home')} onLoggedIn={(s) => { setSession(s); setPage('search') }} />
      )}
      {page === 'search' && session && (
        <SearchPage session={session} onBack={() => setPage('home')} onLogout={logout} onSessionExpired={sessionExpired} />
      )}
    </div>
  )
}
