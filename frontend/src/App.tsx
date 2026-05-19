import { useAuth } from '@/context/useAuth'
import { useApp } from '@/context/useApp'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { TransactionsScreen } from '@/screens/TransactionsScreen'
import { ReportsScreen } from '@/screens/ReportsScreen'
import { LoginScreen } from '@/screens/Auth/LoginScreen'
import { RegisterScreen } from '@/screens/Auth/RegisterScreen'
import { ConfirmAccountScreen } from '@/screens/Auth/ConfirmAccountScreen'
import { AppShell } from '@/components/AppShell'
import { useState } from 'react'
import './App.css'

function App() {
  const { user, isLoading, needsConfirmation, pendingEmail } = useAuth()
  const { activeScreen, setActiveScreen } = useApp()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  // Unauthenticated - show custom auth screens
  if (!user) {
    if (needsConfirmation && pendingEmail) {
      return <ConfirmAccountScreen email={pendingEmail} onBackToLogin={() => setAuthMode('login')} />
    }
    if (authMode === 'register') {
      return <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />
    }
    return <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
  }

  const handleLogout = () => {
    setActiveScreen('home')
  }

  // Authenticated - show app screens
  return (
    <AppShell>
      {activeScreen === 'profile' ? (
        <ProfileScreen onLogout={handleLogout} />
      ) : activeScreen === 'settings' ? (
        <SettingsScreen />
      ) : activeScreen === 'transactions' ? (
        <TransactionsScreen />
      ) : activeScreen === 'reports' ? (
        <ReportsScreen />
      ) : (
        <HomeScreen />
      )}
    </AppShell>
  )
}

export default App
