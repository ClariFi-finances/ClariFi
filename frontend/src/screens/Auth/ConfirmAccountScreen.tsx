import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import {
  showErrorAlert,
  showLoadingAlert,
  hideAlert,
  showSuccessAlert
} from '@/utils/validation'
import './AuthScreens.css'

interface ConfirmAccountScreenProps {
  email: string
  onBackToLogin: () => void
}

export function ConfirmAccountScreen({ email, onBackToLogin }: ConfirmAccountScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [codeTouched, setCodeTouched] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { confirmAccount, resendConfirmationCode, isLoading, clearConfirmation } = useAuth()
  const { t } = useI18n()
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 0) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const fullCode = code.join('')

  const codeError = useMemo(() => {
    if (!codeTouched) return null
    if (fullCode.length < 6) return t('auth.confirm.invalidCodeMessage')
    return null
  }, [fullCode, codeTouched, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeTouched(true)

    if (fullCode.length !== 6) {
      await showErrorAlert(t('auth.confirm.invalidCode'), t('auth.confirm.invalidCodeMessage'))
      return
    }

    try {
      showLoadingAlert(t('auth.confirm.loadingTitle'), t('auth.confirm.loadingMessage'))
      await confirmAccount(email, fullCode)
      hideAlert()
      await showSuccessAlert(t('auth.confirm.successTitle'), t('auth.confirm.successMessage'))
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : t('auth.confirm.errorMessage')
      await showErrorAlert(t('auth.confirm.errorTitle'), errorMessage)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    try {
      await resendConfirmationCode(email)
      setResendCooldown(60)
      await showSuccessAlert(t('auth.confirm.resendSuccessTitle'), t('auth.confirm.resendSuccessMessage'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.confirm.resendErrorMessage')
      await showErrorAlert(t('auth.confirm.resendErrorTitle'), errorMessage)
    }
  }

  const handleBackToLogin = () => {
    clearConfirmation()
    onBackToLogin()
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('auth.confirm.title')}</h1>
          <p className="auth-subtitle">
            {t('auth.confirm.subtitle')} <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              {t('auth.confirm.codeLabel')}
            </label>
            <div className="code-input-group" onPaste={handlePaste} onBlur={() => setCodeTouched(true)}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`form-input code-input ${codeError ? 'form-input-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {codeError && <span className="form-error-msg" style={{ justifyContent: 'center' }}>⚠️ {codeError}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || fullCode.length !== 6}
          >
            {isLoading ? t('auth.confirm.submitting') : t('auth.confirm.submitButton')}
          </button>
        </form>

        <div className="auth-divider">
          <span>
            {t('auth.confirm.noCode')}{' '}
            <a
              onClick={handleResendCode}
              className={`auth-link-text auth-link-inline${resendCooldown > 0 ? ' auth-link-disabled' : ''}`}
            >
              {resendCooldown > 0
                ? `${t('auth.confirm.resendIn')} ${resendCooldown}s`
                : t('auth.confirm.resendCode')}
            </a>
          </span>
        </div>

        <div className="auth-divider">
          <span>
            <a onClick={handleBackToLogin} className="auth-link-text auth-link-inline">
              {t('auth.confirm.backToLogin')}
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
