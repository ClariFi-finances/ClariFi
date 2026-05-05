import { createContext, type ReactNode } from 'react'
import { useAuth as useCognitoAuth } from 'react-oidc-context'
import { API_BASE_URL } from '@/config/api'
import { useEffect, useState } from 'react'

export interface User {
  id: number | string
  cognitoId?: string
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
  const [internalUser, setInternalUser] = useState<User | null>(null)
  const [internalLoading, setInternalLoading] = useState(true)

  useEffect(() => {
    async function syncBackendUser() {
      if (cognitoAuth.isAuthenticated && cognitoAuth.user?.profile.sub) {
        try {
          const cognitoId = cognitoAuth.user.profile.sub
          const email = cognitoAuth.user.profile.email || ''
          const name = cognitoAuth.user.profile.name || email.split('@')[0] || 'User'

          // Try to login to get internal user ID
          let userRes = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cognitoAuth.user.access_token}`
            },
            body: JSON.stringify({ cognitoId })
          })

          if (userRes.status === 401 || userRes.status === 404) {
            // User doesn't exist, register them
            userRes = await fetch(`${API_BASE_URL}/users/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cognitoAuth.user.access_token}`
              },
              body: JSON.stringify({ cognitoId })
            })
          }

          if (userRes.ok) {
            const data = await userRes.json()
            setInternalUser({
              id: data.id,
              cognitoId: data.cognitoId,
              name,
              email,
              cpf: '00000000000'
            })
          }
        } catch (e) {
          console.error('Failed to sync backend user', e)
        }
      } else {
        setInternalUser(null)
      }
      setInternalLoading(false)
    }

    if (!cognitoAuth.isLoading) {
      syncBackendUser()
    }
  }, [cognitoAuth.isAuthenticated, cognitoAuth.isLoading, cognitoAuth.user])

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

  const activeUser: User | null = internalUser
  const activeToken = cognitoAuth.isAuthenticated ? cognitoAuth.user?.access_token || null : null
  const activeIsLoading = cognitoAuth.isLoading || cognitoAuth.activeNavigator === "signinRedirect" || internalLoading
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
