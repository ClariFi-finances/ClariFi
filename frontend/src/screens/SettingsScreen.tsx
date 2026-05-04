import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { useApp } from '@/context/useApp'
import { showConfirmDialog } from '@/utils/validation'
import './SettingsScreen.css'

export function SettingsScreen() {
  const { user, logout } = useAuth()
  const { setActiveScreen } = useApp()
  const [theme, setTheme] = useState('escuro')

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?'
    )
    if (confirmed) {
      logout()
      setActiveScreen('home')
    }
  }

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <h1>Configuracoes</h1>
        <p>Gerencie sua conta e preferencias</p>
      </header>

      <div className="settings-content">
        <div className="settings-column left-col">
          {/* User Profile Card */}
          <section className="settings-card user-profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div className="profile-info">
                <h2>{user?.name || 'Usuario'}</h2>
                <p>{user?.email || 'usuario@email.com'}</p>
              </div>
            </div>
            <button className="edit-profile-btn" onClick={() => setActiveScreen('profile')}>Editar Perfil</button>
          </section>

          {/* Appearance */}
          <section className="settings-section appearance-section">
            <h3>Aparencia</h3>
            <div className="theme-options">
              <button 
                className={`theme-btn ${theme === 'claro' ? 'active' : ''}`}
                onClick={() => setTheme('claro')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                Claro
              </button>
              <button 
                className={`theme-btn ${theme === 'escuro' ? 'active' : ''}`}
                onClick={() => setTheme('escuro')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                Escuro
              </button>
              <button 
                className={`theme-btn ${theme === 'sistema' ? 'active' : ''}`}
                onClick={() => setTheme('sistema')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Sistema
              </button>
            </div>
          </section>

          {/* Version Text */}
          <div className="app-version">
            <p className="version-title">Clarifi v1.0.0</p>
            <p className="version-subtitle">Gestao financeira pessoal</p>
          </div>
        </div>

        <div className="settings-column right-col">
          {/* Financas */}
          <section className="settings-section">
            <h3>Financas</h3>
            <div className="settings-card list-card">
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <div className="item-content">
                  <h4>Gerenciar Categorias</h4>
                  <p>Personalize suas categorias de gastos</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
                </div>
                <div className="item-content">
                  <h4>Receitas Fixas</h4>
                  <p>Configure receitas recorrentes</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="list-item">
                <div className="item-icon">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>
                </div>
                <div className="item-content">
                  <h4>Gerenciar Reservas</h4>
                  <p>Configure suas reservas financeiras</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div className="item-content">
                  <h4>Metodos de Pagamento</h4>
                  <p>Cartoes e contas bancarias</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
            </div>
          </section>

          {/* Preferencias */}
          <section className="settings-section">
            <h3>Preferencias</h3>
            <div className="settings-card list-card">
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div className="item-content">
                  <h4>Notificacoes</h4>
                  <p>Alertas e lembretes</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="item-content">
                  <h4>Privacidade e Seguranca</h4>
                  <p>Protecao de dados e acesso</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
              <div className="list-item">
                <div className="item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="item-content">
                  <h4>Ajuda e Suporte</h4>
                  <p>Duvidas e tutoriais</p>
                </div>
                <div className="item-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </div>
            </div>
          </section>

          {/* Sair da conta */}
          <button className="settings-card logout-btn" onClick={handleLogout}>
            <span className="logout-icon">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
