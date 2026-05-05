import { useAuth } from '@/context/useAuth'
import { useApp } from '@/context/useApp'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { TransactionsScreen } from '@/screens/TransactionsScreen'
import { AppShell } from '@/components/AppShell'
import './App.css'

function App() {
  const { user, isLoading, login } = useAuth()
  const { activeScreen, setActiveScreen } = useApp()

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  // Not authenticated - use Cognito hosted UI
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-h)' }}>Welcome to ClariFi</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Please sign in to continue</p>
        <button 
          onClick={login}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
            color: '#000000',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: 'var(--text-base)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Sign In / Register
        </button>
      </div>
    )
  }

  // Authenticated - show app screens
  return (
    <AppShell>
      {activeScreen === 'profile' ? (
        <ProfileScreen onLogout={() => setActiveScreen('home')} />
      ) : activeScreen === 'settings' ? (
        <SettingsScreen />
      ) : activeScreen === 'transactions' ? (
        <TransactionsScreen />
      ) : (
        <HomeScreen />
      )}
    </AppShell>
  )
}

export default App
