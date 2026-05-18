import { useState } from 'react'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
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
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert(t('auth.login.invalidEmail'), emailValidation.error || '')
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert(t('auth.login.invalidPassword'), passwordValidation.error || '')
      return
    }

    try {
      showLoadingAlert(t('auth.login.loadingTitle'), t('auth.login.loadingMessage'))
      await login(email, password)
      hideAlert()
      await showSuccessAlert(t('auth.login.successTitle'), t('auth.login.successMessage'))
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : t('auth.login.errorMessage')
      await showErrorAlert(t('auth.login.errorTitle'), errorMessage)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img className="auth-title-img" src={clarifiLogotype} alt="ClariFi" />
          <p className="auth-subtitle">{t('auth.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.login.email')}
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.login.emailPlaceholder')}
              className="form-input"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.login.passwordPlaceholder')}
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
            {isLoading ? t('auth.login.submitting') : t('auth.login.submitButton')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.login.noAccount')}<a onClick={onSwitchToRegister} className="auth-link-text">{t('auth.login.createAccount')}</a></span>
        </div>
      </div>
    </div>
  )
}
