import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  id: number
  name: string
  email: string
  cpf: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, cpf: string) => Promise<void>
  logout: () => void
  clearError: () => void
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
      const response = await fetch('http://localhost:5080/api/users', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to login')
      }

      const users = await response.json()
      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      )

      if (!foundUser) {
        throw new Error('Invalid credentials')
      }

      const token = `token_${foundUser.id}_${Date.now()}`
      setToken(token)
      setUser(foundUser)
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(foundUser))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
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
      const response = await fetch('http://localhost:5080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          cpf,
          paymentMethods: [],
          transactions: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to register')
      }

      const newUser = await response.json()
      const token = `token_${newUser.id}_${Date.now()}`
      setToken(token)
      setUser(newUser)
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


