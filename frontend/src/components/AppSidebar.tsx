import { useState, useRef, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useAuth } from '@/context/useAuth'
import { BarChart3, Home, Plus, Settings, Target, User, ArrowUpCircle, ArrowDownCircle, Camera, Loader2 } from 'lucide-react'
import { useApp } from '@/context/useApp'
import { useI18n } from '@/hooks/useI18n'
import Tesseract from 'tesseract.js'
import './AppSidebar.css'

type NavItem = {
  id: string
  label: string
  icon: string
  targetScreen?: 'home' | 'profile' | 'settings' | 'transactions' | 'reports' | 'goals'
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home', targetScreen: 'home' },
  { id: 'reports', label: 'Relatorios', icon: 'reports', targetScreen: 'reports' },
  { id: 'goals', label: 'Metas', icon: 'goals', targetScreen: 'goals' },
  { id: 'transactions', label: 'Transacoes', icon: 'transactions', targetScreen: 'transactions' },
  { id: 'settings', label: 'Configuracoes', icon: 'settings', targetScreen: 'settings' },
]

const NAV_ICON_MAP: Record<string, ReactElement> = {
  home: <Home size={18} />,
  reports: <BarChart3 size={18} />,
  goals: <Target size={18} />,
  transactions: <BarChart3 size={18} />,
  settings: <Settings size={18} />,
}

export function AppSidebar() {
  const { user } = useAuth()
  const { 
    activeScreen, 
    setActiveScreen, 
    setIsNewTransactionModalOpen, 
    setTransactionModalMode, 
    setInitialTransactionAmount,
    setInitialTransactionTitle,
    setInitialTransactionDate
  } = useApp()
  const { t } = useI18n()
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    try {
      // Run OCR using Tesseract
      const result = await Tesseract.recognize(file, 'por+eng')
      const text = result.data.text
      
      // Remove any numbers followed by a % sign (e.g. 10,00%, 22.00%)
      const cleanText = text.replace(/\d+[.,]\d{2}\s*%/g, '')
      
      const lines = cleanText.split('\n')
      let extractedAmount = 0
      
      // Pass 1: Look for keywords like "TOTAL", "VALOR", "COMPLESSIVO"
      for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase()
        if (lowerLine.includes('total') || lowerLine.includes('valor') || lowerLine.includes('complessivo')) {
          // Check this line and the next line for numbers
          const searchArea = lines[i] + ' ' + (lines[i + 1] || '')
          const matches = searchArea.match(/\d+[.,]\d{2}/g)
          if (matches) {
            matches.forEach(m => {
              const parsed = parseFloat(m.replace(',', '.'))
              if (!isNaN(parsed) && parsed > extractedAmount) {
                extractedAmount = parsed
              }
            })
          }
        }
      }

      // Pass 2: If we didn't find anything near "TOTAL", fallback to the maximum amount found in the entire clean text
      if (extractedAmount === 0) {
        const fallbackMatches = cleanText.match(/\d+[.,]\d{2}/g) || []
        fallbackMatches.forEach(m => {
          const parsed = parseFloat(m.replace(',', '.'))
          if (!isNaN(parsed) && parsed > extractedAmount) {
            extractedAmount = parsed
          }
        })
      }

      // Extract Date
      let extractedDate = ''
      const dateRegex = /\b(\d{2})\/(\d{2})\/(\d{2,4})\b/
      const dateMatch = cleanText.match(dateRegex)
      if (dateMatch) {
        const day = dateMatch[1]
        const month = dateMatch[2]
        let year = dateMatch[3]
        if (year.length === 2) {
          year = '20' + year
        }
        const testDate = new Date(`${year}-${month}-${day}`)
        if (!isNaN(testDate.getTime())) {
          extractedDate = `${year}-${month}-${day}`
        }
      }

      // Extract Title (store name)
      let extractedTitle = ''
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim()
        const lowerLine = line.toLowerCase()
        if (line.length < 3 || line.length > 50) continue
        if (
          lowerLine.includes('cnpj') || 
          lowerLine.includes('tel') || 
          lowerLine.includes('fone') || 
          lowerLine.includes('data') || 
          lowerLine.includes('hora') || 
          lowerLine.includes('avenida') || 
          lowerLine.includes('rua') || 
          lowerLine.includes('www.') ||
          lowerLine.includes('http')
        ) continue
        if (line.replace(/[^0-9]/g, '').length > line.length * 0.4) continue
        
        extractedTitle = line
        break
      }

      if (extractedAmount > 0) {
        setInitialTransactionAmount(extractedAmount.toString())
      } else {
        setInitialTransactionAmount('')
      }
      setInitialTransactionTitle(extractedTitle)
      setInitialTransactionDate(extractedDate)
      
      openModal('expense')
    } catch (error) {
      console.error('Error during OCR:', error)
      alert(t('home.scanError', 'Failed to read the receipt.'))
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsQuickMenuOpen(false)
      }
    }
    if (isQuickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isQuickMenuOpen])

  const openModal = (mode: 'income' | 'expense') => {
    setTransactionModalMode(mode)
    setIsNewTransactionModalOpen(true)
    setActiveScreen('home')
    setIsQuickMenuOpen(false)
  }

  return (
    <>
      <aside className="app-sidebar desktop-sidebar">
        <div className="app-sidebar-brand">
          <div className="brand-icon">
            <img className="brand-icon-img" src="../public/favicon.svg" alt="ClariFi" />
          </div>
          <div>
            <p className="brand-title">{t('sidebar.brandTitle', 'ClariFi')}</p>
            <p className="brand-subtitle">{t('sidebar.brandSubtitle', 'Financial Management')}</p>
          </div>
        </div>

        <div className="sidebar-action-container" ref={menuRef}>
          <button 
            className={`new-transaction-btn ${isQuickMenuOpen ? 'active' : ''}`}
            type="button"
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
          >
            <Plus size={18} />
            {t('sidebar.newTransaction', 'New Transaction')}
          </button>

          {isQuickMenuOpen && (
            <div className="sidebar-quick-menu">
              <button className="quick-menu-item" type="button" onClick={() => openModal('income')}>
                <ArrowUpCircle size={18} className="quick-menu-icon" />
                <span>{t('home.income')}</span>
              </button>
              <button className="quick-menu-item danger" type="button" onClick={() => openModal('expense')}>
                <ArrowDownCircle size={18} className="quick-menu-icon" />
                <span>{t('home.expense')}</span>
              </button>
              <button 
                className="quick-menu-item" 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 size={18} className="quick-menu-icon spin" />
                ) : (
                  <Camera size={18} className="quick-menu-icon" />
                )}
                <span>{isScanning ? t('home.scanning', 'Scanning...') : t('home.scan', 'Scan Receipt')}</span>
              </button>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleScan}
              />
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.targetScreen === activeScreen
            const isDisabled = item.disabled || !item.targetScreen || (item.id === 'reports' && !user?.isAdmin)

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                type="button"
                disabled={isDisabled}
                onClick={() => item.targetScreen && setActiveScreen(item.targetScreen)}
              >
                <span className="nav-icon">{NAV_ICON_MAP[item.icon]}</span>
                <span>{t(`sidebar.nav.${item.id}`, item.label)}</span>
              </button>
            )
          })}
        </nav>

        <button
          className={`sidebar-user ${activeScreen === 'profile' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveScreen('profile')}
        >
          <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          <span className="user-content">
            <span className="user-label">{t('sidebar.userLabel', 'User')}</span>
            <span className="user-email">{user?.email || 'usuario@email.com'}</span>
          </span>
        </button>
      </aside>

      <nav className="mobile-sidebar" aria-label={t('sidebar.mobileNavAriaLabel', 'Main navigation')}>
        <button
          className={`mobile-nav-item ${activeScreen === 'home' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveScreen('home')}
        >
          <Home size={18} className="mobile-icon" />
          <span>{t('sidebar.nav.home', 'Home')}</span>
        </button>
        <button
          className={`mobile-nav-item ${activeScreen === 'reports' ? 'active' : ''}`}
          type="button"
          disabled={!user?.isAdmin}
          onClick={() => setActiveScreen('reports')}
        >
          <BarChart3 size={18} className="mobile-icon" />
          <span>{t('sidebar.nav.reports', 'Reports')}</span>
        </button>
        <button 
          className="mobile-action-btn" 
          type="button" 
          aria-label={t('sidebar.newTransaction', 'New Transaction')}
          onClick={() => {
            // For mobile, maybe just open the expense modal directly or toggle a menu?
            // User said "faz igual o botao da tela de dashboard", which for mobile is usually a FAB.
            // Let's keep it simple and just open home + expense modal for mobile for now, 
            // OR we could also show the menu here. 
            // Let's make it consistent.
            setIsQuickMenuOpen(!isQuickMenuOpen)
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <Plus size={22} />
        </button>

        {isQuickMenuOpen && (
          <div 
            className="mobile-quick-menu-overlay" 
            onClick={() => setIsQuickMenuOpen(false)}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="mobile-quick-menu" onClick={e => e.stopPropagation()}>
              <button className="quick-menu-item" type="button" onClick={() => openModal('income')}>
                <ArrowUpCircle size={18} className="quick-menu-icon" />
                <span>{t('home.income')}</span>
              </button>
              <button className="quick-menu-item danger" type="button" onClick={() => openModal('expense')}>
                <ArrowDownCircle size={18} className="quick-menu-icon" />
                <span>{t('home.expense')}</span>
              </button>
              <button 
                className="quick-menu-item" 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 size={18} className="quick-menu-icon spin" />
                ) : (
                  <Camera size={18} className="quick-menu-icon" />
                )}
                <span>{isScanning ? t('home.scanning', 'Scanning...') : t('home.scan', 'Scan Receipt')}</span>
              </button>
            </div>
          </div>
        )}
        <button
          className={`mobile-nav-item ${activeScreen === 'goals' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveScreen('goals')}
        >
          <Target size={18} className="mobile-icon" />
          <span>{t('sidebar.nav.goals', 'Goals')}</span>
        </button>
        <button
          className={`mobile-nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveScreen('profile')}
        >
          <User size={18} className="mobile-icon" />
          <span>{t('sidebar.nav.profile', 'Profile')}</span>
        </button>
      </nav>
    </>
  )
}
