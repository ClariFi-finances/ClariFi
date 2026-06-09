import { useState, useMemo } from 'react'
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
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const { login, isLoading } = useAuth()
  const { t } = useI18n()

  const emailError = useMemo(() => {
    if (!emailTouched) return null
    if (!email.trim()) return t('validation.email.required')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return t('validation.email.invalid')
    return null
  }, [email, emailTouched, t])

  const passwordError = useMemo(() => {
    if (!passwordTouched) return null
    if (!password.trim()) return t('validation.password.required')
    if (password.length < 6) return t('validation.password.minLength')
    return null
  }, [password, passwordTouched, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setEmailTouched(true)
    setPasswordTouched(true)

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert(t('auth.login.invalidEmail'), t('validation.email.invalid'))
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert(t('auth.login.invalidPassword'), t('validation.password.minLength'))
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
              onBlur={() => setEmailTouched(true)}
              placeholder={t('auth.login.emailPlaceholder')}
              className={`form-input ${emailError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
            {emailError && <span className="form-error-msg">⚠️ {emailError}</span>}
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
              onBlur={() => setPasswordTouched(true)}
              placeholder={t('auth.login.passwordPlaceholder')}
              className={`form-input ${passwordError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {passwordError && <span className="form-error-msg">⚠️ {passwordError}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || !email || !password || !!emailError || !!passwordError}
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
