import { useAuth } from '@/context/useAuth'
import { useApp } from '@/context/useApp'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { TransactionsScreen } from '@/screens/TransactionsScreen'
import { AppShell } from '@/components/AppShell'
import { useEffect } from 'react'
import './App.css'

function App() {
  const { user, isLoading, login } = useAuth()
  const { activeScreen, setActiveScreen } = useApp()

  useEffect(() => {
    if (!isLoading && !user) {
      login()
    }
  }, [isLoading, user, login])

  // Show loading state
  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Carregando...</p>
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
