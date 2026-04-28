import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { validateEmail, validatePassword, showErrorAlert, showLoadingAlert, hideAlert, showSuccessAlert } from '@/utils/validation'
import clarifiLogotype from '@/assets/clarifiLogotype.svg'
import './AuthScreens.css'

interface LoginScreenProps {
  onSwitchToRegister: () => void
}

export function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert('Email Inválido', emailValidation.error || '')
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert('Senha Inválida', passwordValidation.error || '')
      return
    }

    try {
      showLoadingAlert('Entrando...', 'Por favor, aguarde.')
      await login(email, password)
      hideAlert()
      await showSuccessAlert('Sucesso!', 'Bem-vindo de volta!')
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : 'Falha ao entrar'
      await showErrorAlert('Erro ao Entrar', errorMessage)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img className="auth-title-img" src={clarifiLogotype} alt="ClariFi" />
          <p className="auth-subtitle">Gerencie suas finanças com inteligência</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="form-input"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Não tem uma conta?</span>
        </div>

        <button
          type="button"
          className="auth-secondary-button"
          onClick={onSwitchToRegister}
          disabled={isLoading}
        >
          Criar Conta
        </button>
      </div>
    </div>
  )
}

