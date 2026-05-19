import { useState, useRef, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useAuth } from '@/context/useAuth'
import { BarChart3, Home, Plus, Settings, Target, User, ArrowUpCircle, ArrowDownCircle, Camera } from 'lucide-react'
import { useApp } from '@/context/useApp'
import { useI18n } from '@/hooks/useI18n'
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
  const { activeScreen, setActiveScreen, setIsNewTransactionModalOpen, setTransactionModalMode } = useApp()
  const { t } = useI18n()
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
              <button className="quick-menu-item" type="button" disabled>
                <Camera size={18} className="quick-menu-icon" />
                <span>{t('home.scan')}</span>
                <span className="quick-menu-hint">{t('home.scanDisabled')}</span>
              </button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.targetScreen === activeScreen
            const isDisabled = item.disabled || !item.targetScreen

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
        >
          <Plus size={22} />
        </button>

        {isQuickMenuOpen && (
          <div className="mobile-quick-menu-overlay" onClick={() => setIsQuickMenuOpen(false)}>
            <div className="mobile-quick-menu" onClick={e => e.stopPropagation()}>
              <button className="quick-menu-item" type="button" onClick={() => openModal('income')}>
                <ArrowUpCircle size={18} className="quick-menu-icon" />
                <span>{t('home.income')}</span>
              </button>
              <button className="quick-menu-item danger" type="button" onClick={() => openModal('expense')}>
                <ArrowDownCircle size={18} className="quick-menu-icon" />
                <span>{t('home.expense')}</span>
              </button>
              <button className="quick-menu-item" type="button" disabled>
                <Camera size={18} className="quick-menu-icon" />
                <span>{t('home.scan')}</span>
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
