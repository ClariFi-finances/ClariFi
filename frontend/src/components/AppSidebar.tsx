import type { ReactElement } from 'react'
import { useAuth } from '@/context/useAuth'
import { BarChart3, Home, Plus, Settings, Target, User } from 'lucide-react'
import { useApp } from '@/context/useApp'
import { useI18n } from '@/hooks/useI18n'
import './AppSidebar.css'

type NavItem = {
  id: string
  label: string
  icon: string
  targetScreen?: 'home' | 'profile'
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home', targetScreen: 'home' },
  { id: 'reports', label: 'Relatorios', icon: 'reports', disabled: true },
  { id: 'goals', label: 'Metas', icon: 'goals', disabled: true },
  { id: 'transactions', label: 'Transacoes', icon: 'transactions', disabled: true },
  { id: 'settings', label: 'Configuracoes', icon: 'settings', disabled: true },
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
  const { activeScreen, setActiveScreen } = useApp()
  const { t } = useI18n()

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

        <button className="new-transaction-btn" type="button">
          <Plus size={18} />
          {t('sidebar.newTransaction', 'New Transaction')}
        </button>

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
        <button className="mobile-nav-item" type="button" disabled>
          <BarChart3 size={18} className="mobile-icon" />
          <span>{t('sidebar.nav.reports', 'Reports')}</span>
        </button>
        <button className="mobile-action-btn" type="button" aria-label={t('sidebar.newTransaction', 'New Transaction')}>
          <Plus size={22} />
        </button>
        <button className="mobile-nav-item" type="button" disabled>
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
