import { createContext, useState, type ReactNode } from 'react'

export type Screen = 'login' | 'register' | 'home' | 'profile' | 'settings'

export interface AppContextType {
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

export { AppContext }
