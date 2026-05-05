import { useAuth as useCustomAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import clarifiLogotype from '@/assets/clarifiLogotype.svg'
import './AuthScreens.css'

interface LoginScreenProps {
  onSwitchToRegister: () => void
}

export function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const { login, isLoading } = useCustomAuth()
  const { t } = useI18n()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login()
    } catch (err) {
      console.error('Login error', err)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img className="auth-title-img" src={clarifiLogotype} alt="ClariFi" />
          <p className="auth-subtitle">{t('auth.tagline')}</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <button
            type="submit"
            className="auth-button cognito-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.login.submitting', 'Carregando...') : t('auth.login.submitButton', 'Login')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.login.noAccount', 'Não tem uma conta? ')}<a onClick={onSwitchToRegister} className="auth-link-text">{t('auth.login.createAccount', 'Criar Conta')}</a></span>
        </div>
      </div>
    </div>
  )
}
