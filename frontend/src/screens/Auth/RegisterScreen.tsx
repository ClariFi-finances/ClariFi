import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
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
  const { t } = useI18n()

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
      await showErrorAlert(t('auth.register.invalidName'), nameValidation.error || '')
      return
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert(t('auth.register.invalidEmail'), emailValidation.error || '')
      return
    }

    // Validate CPF
    const cpfValidation = validateCPF(cpf)
    if (!cpfValidation.valid) {
      await showErrorAlert(t('auth.register.invalidCPF'), cpfValidation.error || '')
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert(t('auth.register.invalidPassword'), passwordValidation.error || '')
      return
    }

    // Validate password confirmation
    const passwordConfirmationValidation = validatePasswordConfirmation(password, confirmPassword)
    if (!passwordConfirmationValidation.valid) {
      await showErrorAlert(t('auth.register.invalidPasswordConfirmation'), passwordConfirmationValidation.error || '')
      return
    }

    try {
      showLoadingAlert(t('auth.register.loadingTitle'), t('auth.register.loadingMessage'))
      const cleanCPF = cpf.replace(/\D/g, '')
      await register(name, email, password, cleanCPF)
      hideAlert()
      await showSuccessAlert(t('auth.register.successTitle'), t('auth.register.successMessage'))
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : t('auth.register.errorMessage')
      await showErrorAlert(t('auth.register.errorTitle'), errorMessage)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('auth.register.title')}</h1>
          <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('auth.register.fullName')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.register.fullNamePlaceholder')}
              className="form-input"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.register.email')}
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.register.emailPlaceholder')}
              className="form-input"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cpf" className="form-label">
              {t('auth.register.cpf')}
            </label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder={t('auth.register.cpfPlaceholder')}
              className="form-input"
              disabled={isLoading}
              maxLength={14}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.register.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordPlaceholder')}
              className="form-input"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('auth.register.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
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
            {isLoading ? t('auth.register.submitting') : t('auth.register.submitButton')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.register.hasAccount')} <a onClick={onSwitchToLogin} className="auth-link-text">{t('auth.register.signIn')}</a></span>
        </div>
      </div>
    </div>
  )
}
