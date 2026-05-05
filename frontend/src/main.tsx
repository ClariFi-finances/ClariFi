import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { AppProvider } from '@/context/AppContext'
import { I18n } from '@/utils/i18n'
import { AuthProvider as CustomAuthProvider } from '@/context/AuthContext'
import { AuthProvider } from "react-oidc-context"
import { WebStorageStateStore } from 'oidc-client-ts'

// Initialize i18n
I18n.initLanguage()

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_HTTP_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "email openid phone",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
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
