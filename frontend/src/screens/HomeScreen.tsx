import { useApp } from '@/context/AppContext'
import { useI18n } from '@/hooks/useI18n'
import './HomeScreen.css'

export function HomeScreen() {
  const { setActiveScreen } = useApp()
  const { t } = useI18n()

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <p className="greeting">{t('home.greeting')}</p>
          <h1>{t('home.welcome')}</h1>
        </div>
        <button className="notification-btn">
          {t('home.notification')}
        </button>
      </header>

      <div className="home-content">
        {/* Balance Card */}
        <div className="balance-card">
          <p className="balance-label">{t('home.availableBalance')}</p>
          <h2 className="balance-amount">R$ 4.850,00</h2>

          <div className="balance-details">
            <div className="detail">
              <span className="detail-icon">⬆️</span>
              <div>
                <p className="detail-label">{t('home.revenue')}</p>
                <p className="detail-value">R$ 8.500,00</p>
              </div>
            </div>
            <div className="detail">
              <span className="detail-icon">⬇️</span>
              <div>
                <p className="detail-label">{t('home.expenses')}</p>
                <p className="detail-value">R$ 3.650,00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn">
            <span className="action-icon">💸</span>
            <span>{t('home.expense')}</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">💰</span>
            <span>{t('home.income')}</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🎯</span>
            <span>{t('home.goals')}</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="section">
          <div className="section-header">
            <h3>{t('home.recentTransactions')}</h3>
            <a href="#" className="see-all">{t('home.viewAll')}</a>
          </div>
          <div className="transactions-list">
            <div className="transaction-item">
              <div className="transaction-icon">🛒</div>
              <div className="transaction-info">
                <p className="transaction-name">{t('home.grocery')}</p>
                <p className="transaction-date">{t('home.today')}</p>
              </div>
              <p className="transaction-amount negative">-R$ 145,00</p>
            </div>
            <div className="transaction-item">
              <div className="transaction-icon">💼</div>
              <div className="transaction-info">
                <p className="transaction-name">{t('home.salary')}</p>
                <p className="transaction-date">1 de abril</p>
              </div>
              <p className="transaction-amount positive">+R$ 5.000,00</p>
            </div>
          </div>
        </div>

        {/* Profile Link */}
        <button
          className="profile-link"
          onClick={() => setActiveScreen('profile')}
        >
          {t('home.viewProfile')}
        </button>
      </div>
    </div>
  )
}

