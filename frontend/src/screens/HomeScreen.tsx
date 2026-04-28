import { useApp } from '@/context/AppContext'
import './HomeScreen.css'

export function HomeScreen() {
  const { setActiveScreen } = useApp()

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <p className="greeting">Olá,</p>
          <h1>Bem-vindo de volta</h1>
        </div>
        <button className="notification-btn">
          🔔
        </button>
      </header>

      <div className="home-content">
        {/* Balance Card */}
        <div className="balance-card">
          <p className="balance-label">Saldo Disponível</p>
          <h2 className="balance-amount">R$ 4.850,00</h2>

          <div className="balance-details">
            <div className="detail">
              <span className="detail-icon">⬆️</span>
              <div>
                <p className="detail-label">Receitas</p>
                <p className="detail-value">R$ 8.500,00</p>
              </div>
            </div>
            <div className="detail">
              <span className="detail-icon">⬇️</span>
              <div>
                <p className="detail-label">Despesas</p>
                <p className="detail-value">R$ 3.650,00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn">
            <span className="action-icon">💸</span>
            <span>Despesa</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">💰</span>
            <span>Receita</span>
          </button>
          <button className="action-btn">
            <span className="action-icon">🎯</span>
            <span>Metas</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="section">
          <div className="section-header">
            <h3>Transações Recentes</h3>
            <a href="#" className="see-all">Ver todas</a>
          </div>
          <div className="transactions-list">
            <div className="transaction-item">
              <div className="transaction-icon">🛒</div>
              <div className="transaction-info">
                <p className="transaction-name">Supermercado</p>
                <p className="transaction-date">Hoje</p>
              </div>
              <p className="transaction-amount negative">-R$ 145,00</p>
            </div>
            <div className="transaction-item">
              <div className="transaction-icon">💼</div>
              <div className="transaction-info">
                <p className="transaction-name">Salário</p>
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
          Ver Meu Perfil →
        </button>
      </div>
    </div>
  )
}

