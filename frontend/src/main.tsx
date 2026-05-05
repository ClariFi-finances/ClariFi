import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProvider } from '@/context/AppContext'
import { I18n } from '@/utils/i18n'
import { AuthProvider as CustomAuthProvider } from '@/context/AuthContext'
import { AuthProvider } from "react-oidc-context"

// Initialize i18n
I18n.initLanguage()

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.HTTP_VITE_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <CustomAuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </CustomAuthProvider>
    </AuthProvider>
  </StrictMode>,
)
