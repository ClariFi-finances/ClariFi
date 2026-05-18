import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProvider } from '@/context/AppContext'
import { I18n } from '@/utils/i18n'
import { AuthProvider } from '@/context/AuthContext'

// Initialize i18n
I18n.initLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
)
