import { createContext, type ReactNode } from 'react'
import { useAuth as useCognitoAuth } from 'react-oidc-context'

export interface User {
  id: number | string
  name: string
  email: string
  cpf: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: () => Promise<void>
  register: () => Promise<void>
  logout: () => void
  clearError: () => void
  updateProfile: (id: number | string, name: string, email: string, cpf: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const cognitoAuth = useCognitoAuth()

  const login = async () => {
    await cognitoAuth.signinRedirect()
  }

  const register = async () => {
    // You can customize the redirect for signup, or let the user click sign up on the hosted UI
    await cognitoAuth.signinRedirect()
  }

  const updateProfile = async (id: number | string, name: string, email: string, cpf: string) => {
    // Stub: Profile updates should be done via Cognito API or your backend
    console.log('Update profile not natively supported strictly through OIDC SDK alone:', { id, name, email, cpf })
  }

  const logout = () => {
    if (cognitoAuth.isAuthenticated) {
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const logoutUri = import.meta.env.VITE_HTTP_COGNITO_REDIRECT_URI;
      const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
      
      cognitoAuth.removeUser();
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    }
  }

  const clearError = () => {
    // Clear error not directly supported by useAuth in this context without internal reset, but we can clear local state if any.
    cognitoAuth.removeUser();
  }

  const activeUser: User | null = cognitoAuth.isAuthenticated 
    ? {
        id: cognitoAuth.user?.profile.sub || '',
        name: cognitoAuth.user?.profile.name || cognitoAuth.user?.profile.email?.split('@')[0] || 'User',
        email: cognitoAuth.user?.profile.email || '',
        cpf: '00000000000', // Default dummy cpf as it's not provided by Cognito
      }
    : null

  const activeToken = cognitoAuth.isAuthenticated ? cognitoAuth.user?.access_token || null : null
  const activeIsLoading = cognitoAuth.isLoading || cognitoAuth.activeNavigator === "signinRedirect"
  const activeError = cognitoAuth.error ? cognitoAuth.error.message : null

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        token: activeToken,
        isLoading: activeIsLoading,
        error: activeError,
        login,
        register,
        logout,
        clearError,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
