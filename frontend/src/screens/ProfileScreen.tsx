import { useState, useMemo } from 'react'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { validateName, validateEmail, showConfirmDialog, showErrorAlert, showSuccessAlert, showLoadingAlert, hideAlert } from '@/utils/validation'
import { CategorySettingsModal } from '@/components/CategorySettingsModal'
import { FixedIncomeSettingsModal } from '@/components/FixedIncomeSettingsModal'
import { PaymentMethodSettingsModal } from '@/components/PaymentMethodSettingsModal'
import './ProfileScreen.css'

interface ProfileScreenProps {
  onLogout: () => void
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user, logout, isLoading, updateProfile } = useAuth()
  const { t } = useI18n()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')
  const [editedEmail, setEditedEmail] = useState(user?.email || '')
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isFixedIncomeModalOpen, setIsFixedIncomeModalOpen] = useState(false)
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false)

  const nameError = useMemo(() => {
    if (!nameTouched) return null
    const res = validateName(editedName)
    if (!res.valid) {
      return res.error === 'Nome é obrigatório' ? t('validation.name.required') : t('validation.name.minLength')
    }
    return null
  }, [editedName, nameTouched, t])

  const emailError = useMemo(() => {
    if (!emailTouched) return null
    const res = validateEmail(editedEmail)
    if (!res.valid) {
      return res.error === 'Email é obrigatório' ? t('validation.email.required') : t('validation.email.invalid')
    }
    return null
  }, [editedEmail, emailTouched, t])

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      t('profile.confirmLogout'),
      t('profile.confirmLogoutMessage')
    )
    if (confirmed) {
      await logout()
      onLogout()
    }
  }

  const handleSaveEdit = async () => {
    setNameTouched(true)
    setEmailTouched(true)

    // Validate name
    const nameValidation = validateName(editedName)
    if (!nameValidation.valid) {
      await showErrorAlert(t('profile.invalidName'), t('validation.name.minLength'))
      return
    }

    // Validate email
    const emailValidation = validateEmail(editedEmail)
    if (!emailValidation.valid) {
      await showErrorAlert(t('profile.invalidEmail'), t('validation.email.invalid'))
      return
    }

    if (!user) return

    try {
      showLoadingAlert(t('profile.updating'), t('profile.updatingMessage') || 'Atualizando perfil...')
      await updateProfile(user.id, editedName, editedEmail, user.cpf)
      hideAlert()
      await showSuccessAlert(t('profile.profileUpdated'), t('profile.profileUpdateSuccess'))
      setIsEditing(false)
    } catch (err) {
      hideAlert()
      const errorMessage = err instanceof Error ? err.message : t('profile.updateError') || 'Erro ao atualizar perfil'
      await showErrorAlert(t('profile.updateFailed') || 'Erro', errorMessage)
    }
  }

  if (!user) {
    return null
  }

  const formatCPF = (cpf: string) => {
    return cpf
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
      </div>

      <div className="profile-content">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {isEditing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label className="form-label">{t('profile.name')}</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className={`form-input ${nameError ? 'form-input-error' : ''}`}
                  disabled={isLoading}
                />
                {nameError && <span className="form-error-msg">⚠️ {nameError}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.email')}</label>
                <input
                  type="text"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`form-input ${emailError ? 'form-input-error' : ''}`}
                  disabled={isLoading}
                />
                {emailError && <span className="form-error-msg">⚠️ {emailError}</span>}
              </div>

              <div className="profile-edit-actions">
                <button
                  className="auth-button"
                  onClick={handleSaveEdit}
                  disabled={isLoading || !!nameError || !!emailError}
                >
                  {t('common.save')}
                </button>
                <button
                  className="auth-secondary-button"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="profile-name-section">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>

              <button
                className="profile-edit-button"
                onClick={() => {
                  setEditedName(user.name)
                  setEditedEmail(user.email)
                  setNameTouched(false)
                  setEmailTouched(false)
                  setIsEditing(true)
                }}
                disabled={isLoading}
              >
                {t('profile.editProfile')}
              </button>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">{t('profile.cpf')}</span>
            <span className="detail-value">{formatCPF(user.cpf)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('profile.userId')}</span>
            <span className="detail-value">#{user.id}</span>
          </div>
        </div>

        {/* Settings Section */}
        <div className="profile-section">
          <h3>{t('profile.settings')}</h3>
          <div className="settings-list">
            <button className="settings-item" onClick={() => setIsCategoryModalOpen(true)}>
              <span>{t('settings.manageCategoriesTitle', 'Gerenciar Categorias')}</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item" onClick={() => setIsPaymentMethodModalOpen(true)}>
              <span>{t('settings.paymentMethodsTitle', 'Métodos de Pagamento')}</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item" onClick={() => setIsFixedIncomeModalOpen(true)}>
              <span>{t('settings.fixedIncomeTitle', 'Receitas Fixas')}</span>
              <span className="arrow">›</span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="profile-footer">
          <p>{t('profile.version')}</p>
          <p className="footer-subtitle">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Logout Button */}
      <div className="profile-logout-section">
        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {t('profile.logout')}
        </button>
      </div>

      <CategorySettingsModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
      />
      
      <FixedIncomeSettingsModal 
        isOpen={isFixedIncomeModalOpen} 
        onClose={() => setIsFixedIncomeModalOpen(false)} 
      />

      <PaymentMethodSettingsModal 
        isOpen={isPaymentMethodModalOpen} 
        onClose={() => setIsPaymentMethodModalOpen(false)} 
      />
    </div>
  )
}
