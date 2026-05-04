import { createContext, useContext, useState, type ReactNode } from 'react'

type Screen = 'login' | 'register' | 'home' | 'profile' | 'settings'

interface AppContextType {
  activeScreen: Screen
  setActiveScreen: (screen: Screen) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<Screen>('login')

  return (
    <AppContext.Provider value={{ activeScreen, setActiveScreen }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}


