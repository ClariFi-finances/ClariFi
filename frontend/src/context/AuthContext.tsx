import { createContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest, ApiError, getErrorMessage } from '@/utils/apiClient'

export interface User {
  id: number
  name: string
  email: string
  cpf: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, cpf: string) => Promise<void>
  logout: () => void
  clearError: () => void
  updateProfile: (id: number, name: string, email: string, cpf: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const userData = await apiRequest<User>('/users/login', {
        method: 'POST',
        body: {
          email,
          password,
        },
      })
      const token = `token_${userData.id}_${Date.now()}`

      setToken(token)
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
      })
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
      }))
    } catch (err) {
      const errorMessage =
        err instanceof ApiError && err.status === 401
          ? 'Invalid credentials'
          : getErrorMessage(err, 'Login failed')
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    cpf: string
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const newUser = await apiRequest<User>('/users/register', {
        method: 'POST',
        body: {
          name,
          email,
          password,
          cpf,
        },
      })
      const token = `token_${newUser.id}_${Date.now()}`

      setToken(token)
      setUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        cpf: newUser.cpf,
      })
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        cpf: newUser.cpf,
      }))
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Registration failed')
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (id: number, name: string, email: string, cpf: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiRequest<void>(`/users/${id}/update-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          name,
          email,
          cpf,
        },
      })

      const updatedUser = {
        id,
        name,
        email,
        cpf,
      }

      setUser(updatedUser)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Profile update failed')
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
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
