import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  validateName,
  validateEmail,
  validateCPF,
  validatePassword,
  validatePasswordConfirmation,
  showErrorAlert,
  showLoadingAlert,
  hideAlert,
  showSuccessAlert
} from '@/utils/validation'
import './AuthScreens.css'

interface RegisterScreenProps {
  onSwitchToLogin: () => void
}

export function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const { register, isLoading } = useAuth()

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      await showErrorAlert('Nome Inválido', nameValidation.error || '')
      return
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert('Email Inválido', emailValidation.error || '')
      return
    }

    // Validate CPF
    const cpfValidation = validateCPF(cpf)
    if (!cpfValidation.valid) {
      await showErrorAlert('CPF Inválido', cpfValidation.error || '')
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert('Senha Inválida', passwordValidation.error || '')
      return
    }

    // Validate password confirmation
    const passwordConfirmationValidation = validatePasswordConfirmation(password, confirmPassword)
    if (!passwordConfirmationValidation.valid) {
      await showErrorAlert('Confirmação de Senha', passwordConfirmationValidation.error || '')
      return
    }

    try {
      showLoadingAlert('Criando Conta...', 'Por favor, aguarde.')
      const cleanCPF = cpf.replace(/\D/g, '')
      await register(name, email, password, cleanCPF)
      hideAlert()
      await showSuccessAlert('Conta Criada!', 'Bem-vindo ao ClariFi!')
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : 'Falha ao criar conta'
      await showErrorAlert('Erro ao Registrar', errorMessage)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">Junte-se ao ClariFi agora</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="form-input"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

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
            <label htmlFor="cpf" className="form-label">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              className="form-input"
              disabled={isLoading}
              maxLength={14}
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
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || !name || !email || !cpf || !password}
          >
            {isLoading ? 'Criando Conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Já tem uma conta? <a onClick={onSwitchToLogin} className="auth-link-text">Entrar</a></span>
        </div>
      </div>
    </div>
  )
}

