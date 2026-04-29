import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
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
  { id: 'home', label: 'Inicio', icon: '⌂', targetScreen: 'home' },
  { id: 'reports', label: 'Relatorios', icon: '◫', disabled: true },
  { id: 'goals', label: 'Metas', icon: '◎', disabled: true },
  { id: 'transactions', label: 'Transacoes', icon: '$', disabled: true },
  { id: 'settings', label: 'Configuracoes', icon: '⚙', disabled: true },
]

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
          + {t('sidebar.newTransaction', 'New Transaction')}
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
                <span className="nav-icon">{item.icon}</span>
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
          <span className="mobile-icon">⌂</span>
          <span>{t('sidebar.nav.home', 'Home')}</span>
        </button>
        <button className="mobile-nav-item" type="button" disabled>
          <span className="mobile-icon">◫</span>
          <span>{t('sidebar.nav.reports', 'Reports')}</span>
        </button>
        <button className="mobile-action-btn" type="button" aria-label={t('sidebar.newTransaction', 'New Transaction')}>
          <span>+</span>
        </button>
        <button className="mobile-nav-item" type="button" disabled>
          <span className="mobile-icon">◎</span>
          <span>{t('sidebar.nav.goals', 'Goals')}</span>
        </button>
        <button
          className={`mobile-nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveScreen('profile')}
        >
          <span className="mobile-icon">◉</span>
          <span>{t('sidebar.nav.profile', 'Profile')}</span>
        </button>
      </nav>
    </>
  )
}
