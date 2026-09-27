import { useEffect, useRef, useState } from 'react'
import { App as NativeApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import CarViewer from './components/CarViewer'
import HeroUI from './components/HeroUI'
import LoaderUI from './components/LoaderUI'
import SpecsPage from './components/SpecsPage'
import ReportPage from './components/ReportPage'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'specs' | 'report'
  const pageRef = useRef(page)
  pageRef.current = page

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined
    const handle = NativeApp.addListener('backButton', () => {
      const current = pageRef.current
      if (current === 'report') setPage('specs')
      else if (current === 'specs') setPage('home')
      else NativeApp.exitApp()
    })
    return () => {
      handle.then((listener) => listener.remove())
    }
  }, [])

  return (
    <div className="app">
      {page === 'home' && (
        <>
          <LoaderUI />
          <CarViewer />
          <HeroUI onViewSpecs={() => setPage('specs')} onViewReport={() => setPage('report')} onHome={() => setPage('home')} />
        </>
      )}
      {page === 'specs' && (
        <SpecsPage onBack={() => setPage('home')} onViewReport={() => setPage('report')} onHome={() => setPage('home')} />
      )}
      {page === 'report' && (
        <ReportPage onBack={() => setPage('specs')} onHome={() => setPage('home')} />
      )}
    </div>
  )
}
