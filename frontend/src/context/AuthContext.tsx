import { createContext, useState, useEffect, type ReactNode } from 'react'
import { CognitoUserPool, AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserSession } from 'amazon-cognito-identity-js'
import { API_BASE_URL } from '@/config/api'

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
  needsConfirmation: boolean
  pendingEmail: string | null
  login: (email?: string, password?: string) => Promise<void>
  register: (name?: string, email?: string, password?: string, cpf?: string) => Promise<void>
  confirmAccount: (email: string, code: string) => Promise<void>
  resendConfirmationCode: (email: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  clearConfirmation: () => void
  updateProfile: (id: number | string, name: string, email: string, cpf: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const poolData = {
  UserPoolId: (import.meta.env.VITE_COGNITO_AUTHORITY as string || '').split('/').pop() || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string || ''
}
const userPool = new CognitoUserPool(poolData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [internalUser, setInternalUser] = useState<User | null>(null)
  const [session, setSession] = useState<CognitoUserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingPassword, setPendingPassword] = useState<string | null>(null)

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true)
      const currentUser = userPool.getCurrentUser()
      
      if (currentUser) {
        currentUser.getSession(async (err: Error | null, currentSession: CognitoUserSession | null) => {
          if (err || !currentSession || !currentSession.isValid()) {
            setSession(null)
            setInternalUser(null)
            setIsLoading(false)
            return
          }
          
          setSession(currentSession)
          
          currentUser.getUserAttributes(async (err, attributes) => {
            if (err) {
              setIsLoading(false)
              return
            }
            
            const attrs: Record<string, string> = {}
            attributes?.forEach(attr => {
              attrs[attr.getName()] = attr.getValue()
            })
            
            const cognitoId = attrs['sub']
            const email = attrs['email'] || ''
            const name = attrs['name'] || email.split('@')[0] || 'User'
            const cpf = attrs['custom:Cpf'] || attrs['custom:cpf'] || '00000000000'
            const accessToken = currentSession.getAccessToken().getJwtToken()
            
            await syncBackendUser(cognitoId, name, email, cpf, accessToken)
          })
        })
      } else {
        setSession(null)
        setInternalUser(null)
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  async function syncBackendUser(cognitoId: string, name: string, email: string, cpf: string, accessToken: string) {
    try {
      let userRes = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ cognitoId })
      })

      if (userRes.status === 401 || userRes.status === 404) {
        userRes = await fetch(`${API_BASE_URL}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ cognitoId, name, email, cpf })
        })
      }

      if (userRes.ok) {
        const data = await userRes.json()
        setInternalUser({
          id: data.id,
          cognitoId: data.cognitoId,
          name: data.name || name,
          email: data.email || email,
          cpf: data.cpf || cpf
        })
      }
    } catch (e) {
      console.error('Failed to sync backend user', e)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email?: string, password?: string) => {
    if (!email || !password) return
    setError(null)
    setIsLoading(true)
    
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    })
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    })
    
    return new Promise<void>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          setSession(result)
          cognitoUser.getUserAttributes(async (err, attributes) => {
            if (err) {
              setIsLoading(false)
              reject(err)
              return
            }
            
            const attrs: Record<string, string> = {}
            attributes?.forEach(attr => {
              attrs[attr.getName()] = attr.getValue()
            })
            
            const cognitoId = attrs['sub']
            const userEmail = attrs['email'] || email
            const name = attrs['name'] || userEmail.split('@')[0] || 'User'
            const cpf = attrs['custom:Cpf'] || attrs['custom:cpf'] || '00000000000'
            const accessToken = result.getAccessToken().getJwtToken()
            
            await syncBackendUser(cognitoId, name, userEmail, cpf, accessToken)
            resolve()
          })
        },
        onFailure: (err) => {
          setIsLoading(false)
          setError(err.message || 'Login failed')
          reject(err)
        }
      })
    })
  }

  const register = async (name?: string, email?: string, password?: string, cpf?: string) => {
    if (!name || !email || !password || !cpf) return
    setError(null)
    setIsLoading(true)
    
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
      new CognitoUserAttribute({ Name: 'custom:Cpf', Value: cpf })
    ]
    
    return new Promise<void>((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], async (err) => {
        setIsLoading(false)
        if (err) {
          setError(err.message || 'Registration failed')
          reject(err)
          return
        }
        
        // Account created - user needs to confirm email with verification code
        setPendingEmail(email)
        setPendingPassword(password)
        setNeedsConfirmation(true)
        resolve()
      })
    })
  }

  const confirmAccount = async (email: string, code: string) => {
    setError(null)
    setIsLoading(true)

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    })

    return new Promise<void>((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, async (err) => {
        if (err) {
          setIsLoading(false)
          setError(err.message || 'Confirmation failed')
          reject(err)
          return
        }

        // Auto-login after successful confirmation
        try {
          if (pendingPassword) {
            await login(email, pendingPassword)
          }
          setNeedsConfirmation(false)
          setPendingEmail(null)
          setPendingPassword(null)
          resolve()
        } catch (loginErr) {
          setIsLoading(false)
          setNeedsConfirmation(false)
          setPendingEmail(null)
          setPendingPassword(null)
          resolve()
        }
      })
    })
  }

  const resendConfirmationCode = async (email: string) => {
    setError(null)

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    })

    return new Promise<void>((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          setError(err.message || 'Failed to resend code')
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  const clearConfirmation = () => {
    setNeedsConfirmation(false)
    setPendingEmail(null)
    setPendingPassword(null)
  }

  const updateProfile = async (id: number | string, name: string, email: string, cpf: string) => {
    console.log('Update profile:', { id, name, email, cpf })
  }

  const logout = async () => {
    const currentUser = userPool.getCurrentUser()
    if (currentUser) {
      currentUser.signOut()
    }
    setSession(null)
    setInternalUser(null)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user: internalUser,
        token: session?.getAccessToken().getJwtToken() || null,
        isLoading,
        error,
        needsConfirmation,
        pendingEmail,
        login,
        register,
        confirmAccount,
        resendConfirmationCode,
        logout,
        clearError,
        clearConfirmation,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
