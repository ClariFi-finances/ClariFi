import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import './AuthScreens.css'

interface RegisterScreenProps {
  onSwitchToLogin: () => void
}

export function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const { register, isLoading } = useAuth()
  const { t } = useI18n()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register()
    } catch (err) {
      console.error('Registration error', err)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('auth.register.title')}</h1>
          <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <button
            type="submit"
            className="auth-button cognito-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.register.submitting', 'Carregando...') : t('auth.register.submitButton', 'Registrar')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.register.hasAccount')} <a onClick={onSwitchToLogin} className="auth-link-text">{t('auth.register.signIn')}</a></span>
        </div>
      </div>
    </div>
  )
}
