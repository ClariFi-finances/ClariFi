import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/hooks/useI18n'
import { validateName, validateEmail, showConfirmDialog, showErrorAlert, showSuccessAlert, showLoadingAlert, hideAlert } from '@/utils/validation'
import './AuthScreens.css'

interface ProfileScreenProps {
  onLogout: () => void
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user, logout, isLoading, updateProfile } = useAuth()
  const { t } = useI18n()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')
  const [editedEmail, setEditedEmail] = useState(user?.email || '')

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      t('profile.confirmLogout'),
      t('profile.confirmLogoutMessage')
    )
    if (confirmed) {
      logout()
      onLogout()
    }
  }

  const handleSaveEdit = async () => {
    // Validate name
    const nameValidation = validateName(editedName)
    if (!nameValidation.valid) {
      await showErrorAlert(t('profile.invalidName'), nameValidation.error || '')
      return
    }

    // Validate email
    const emailValidation = validateEmail(editedEmail)
    if (!emailValidation.valid) {
      await showErrorAlert(t('profile.invalidEmail'), emailValidation.error || '')
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
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.email')}</label>
                <input
                  type="text"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div className="profile-edit-actions">
                <button
                  className="auth-button"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                >
                  {t('profile.settings')}
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
                onClick={() => setIsEditing(true)}
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
            <button className="settings-item">
              <span>{t('profile.manageCategories')}</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>{t('profile.fixedIncome')}</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>{t('profile.manageReserves')}</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>{t('profile.privacyAndSecurity')}</span>
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
    </div>
  )
}

