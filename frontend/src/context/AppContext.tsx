import { createContext, useState, useEffect, type ReactNode } from 'react'

export type Screen = 'login' | 'register' | 'home' | 'profile' | 'settings'

export type Theme = 'claro' | 'escuro' | 'sistema'

export interface AppContextType {
  activeScreen: Screen
  setActiveScreen: (screen: Screen) => void
  theme: Theme
  setTheme: (theme: Theme) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<Screen>('login')
  const [theme, setThemeState] = useState<Theme>('escuro')

  const applyThemeToDOM = (t: Theme) => {
    if (t === 'sistema') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', isDark ? 'escuro' : 'claro')
    } else {
      document.documentElement.setAttribute('data-theme', t)
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as Theme
    if (savedTheme === 'claro' || savedTheme === 'escuro' || savedTheme === 'sistema') {
      setThemeState(savedTheme)
      applyThemeToDOM(savedTheme)
    } else {
      setThemeState('escuro')
      applyThemeToDOM('escuro')
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'sistema') {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'escuro' : 'claro')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('app_theme', newTheme)
    applyThemeToDOM(newTheme)
  }

  return (
    <AppContext.Provider value={{ activeScreen, setActiveScreen, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext }
