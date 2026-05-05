import { useAuth } from '@/context/useAuth'
import { useApp } from '@/context/useApp'
import { LoginScreen } from '@/screens/LoginScreen'
import { RegisterScreen } from '@/screens/RegisterScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { TransactionsScreen } from '@/screens/TransactionsScreen'
import { AppShell } from '@/components/AppShell'
import './App.css'

function App() {
  const { user, isLoading } = useAuth()
  const { activeScreen, setActiveScreen } = useApp()

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  // Not authenticated - show auth screens
  if (!user) {
    return (
      <>
        {activeScreen === 'register' ? (
          <RegisterScreen onSwitchToLogin={() => setActiveScreen('login')} />
        ) : (
          <LoginScreen onSwitchToRegister={() => setActiveScreen('register')} />
        )}
      </>
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
