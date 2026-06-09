import { useState, useMemo } from 'react'
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
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [cpfTouched, setCpfTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  const { register, isLoading } = useAuth()
  const { t } = useI18n()

  const nameError = useMemo(() => {
    if (!nameTouched) return null
    const res = validateName(name)
    if (!res.valid) {
      return res.error === 'Nome é obrigatório' ? t('validation.name.required') : t('validation.name.minLength')
    }
    return null
  }, [name, nameTouched, t])

  const emailError = useMemo(() => {
    if (!emailTouched) return null
    const res = validateEmail(email)
    if (!res.valid) {
      return res.error === 'Email é obrigatório' ? t('validation.email.required') : t('validation.email.invalid')
    }
    return null
  }, [email, emailTouched, t])

  const cpfError = useMemo(() => {
    if (!cpfTouched) return null
    const res = validateCPF(cpf)
    if (!res.valid) {
      if (res.error === 'CPF é obrigatório') return t('validation.cpf.required')
      if (res.error === 'CPF deve conter 11 dígitos') return t('validation.cpf.invalidLength')
      return t('validation.cpf.invalid')
    }
    return null
  }, [cpf, cpfTouched, t])

  const passwordError = useMemo(() => {
    if (!passwordTouched) return null
    const res = validatePassword(password)
    if (!res.valid) {
      return res.error === 'Senha é obrigatória' ? t('validation.password.required') : t('validation.password.minLength')
    }
    return null
  }, [password, passwordTouched, t])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPasswordTouched) return null
    const res = validatePasswordConfirmation(password, confirmPassword)
    if (!res.valid) return t('validation.passwordConfirmation.notMatch')
    return null
  }, [password, confirmPassword, confirmPasswordTouched, t])

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

    setNameTouched(true)
    setEmailTouched(true)
    setCpfTouched(true)
    setPasswordTouched(true)
    setConfirmPasswordTouched(true)

    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      await showErrorAlert(t('auth.register.invalidName'), t('validation.name.minLength'))
      return
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      await showErrorAlert(t('auth.register.invalidEmail'), t('validation.email.invalid'))
      return
    }

    // Validate CPF
    const cpfValidation = validateCPF(cpf)
    if (!cpfValidation.valid) {
      await showErrorAlert(t('auth.register.invalidCPF'), t('validation.cpf.invalid'))
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await showErrorAlert(t('auth.register.invalidPassword'), t('validation.password.minLength'))
      return
    }

    // Validate password confirmation
    const passwordConfirmationValidation = validatePasswordConfirmation(password, confirmPassword)
    if (!passwordConfirmationValidation.valid) {
      await showErrorAlert(t('auth.register.invalidPasswordConfirmation'), t('validation.passwordConfirmation.notMatch'))
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
              onBlur={() => setNameTouched(true)}
              placeholder={t('auth.register.fullNamePlaceholder')}
              className={`form-input ${nameError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="name"
            />
            {nameError && <span className="form-error-msg">⚠️ {nameError}</span>}
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
              onBlur={() => setEmailTouched(true)}
              placeholder={t('auth.register.emailPlaceholder')}
              className={`form-input ${emailError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
            {emailError && <span className="form-error-msg">⚠️ {emailError}</span>}
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
              onBlur={() => setCpfTouched(true)}
              placeholder={t('auth.register.cpfPlaceholder')}
              className={`form-input ${cpfError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              maxLength={14}
            />
            {cpfError && <span className="form-error-msg">⚠️ {cpfError}</span>}
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
              onBlur={() => setPasswordTouched(true)}
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`form-input ${passwordError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {passwordError && <span className="form-error-msg">⚠️ {passwordError}</span>}
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
              onBlur={() => setConfirmPasswordTouched(true)}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              className={`form-input ${confirmPasswordError ? 'form-input-error' : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPasswordError && <span className="form-error-msg">⚠️ {confirmPasswordError}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={
              isLoading ||
              !name ||
              !email ||
              !cpf ||
              !password ||
              !confirmPassword ||
              !!nameError ||
              !!emailError ||
              !!cpfError ||
              !!passwordError ||
              !!confirmPasswordError
            }
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
