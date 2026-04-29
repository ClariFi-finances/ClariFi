import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { LoginScreen } from '@/screens/LoginScreen'
import { RegisterScreen } from '@/screens/RegisterScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
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
      ) : (
        <HomeScreen />
      )}
    </AppShell>
  )
}

export default App
