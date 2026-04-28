import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { validateName, validateEmail, showConfirmDialog, showErrorAlert, showSuccessAlert } from '@/utils/validation'
import './AuthScreens.css'

interface ProfileScreenProps {
  onLogout: () => void
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user, logout, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')
  const [editedEmail, setEditedEmail] = useState(user?.email || '')

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Sair da Conta',
      'Tem certeza que deseja sair?'
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
      await showErrorAlert('Nome Inválido', nameValidation.error || '')
      return
    }

    // Validate email
    const emailValidation = validateEmail(editedEmail)
    if (!emailValidation.valid) {
      await showErrorAlert('Email Inválido', emailValidation.error || '')
      return
    }

    // TODO: Implement API call to update user profile
    await showSuccessAlert('Perfil Atualizado', 'Suas informações foram salvas com sucesso!')
    setIsEditing(false)
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
        <h1>Perfil</h1>
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
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
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
                  Salvar
                </button>
                <button
                  className="auth-secondary-button"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancelar
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
                Editar Perfil
              </button>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">CPF</span>
            <span className="detail-value">{formatCPF(user.cpf)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">ID do Usuário</span>
            <span className="detail-value">#{user.id}</span>
          </div>
        </div>

        {/* Settings Section */}
        <div className="profile-section">
          <h3>Configurações</h3>
          <div className="settings-list">
            <button className="settings-item">
              <span>Gerenciar Categorias</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>Receitas Fixas</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>Gerenciar Reservas</span>
              <span className="arrow">›</span>
            </button>
            <button className="settings-item">
              <span>Privacidade e Segurança</span>
              <span className="arrow">›</span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="profile-footer">
          <p>ClariFi v1.0.0</p>
          <p className="footer-subtitle">Gestão financeira pessoal</p>
        </div>
      </div>

      {/* Logout Button */}
      <div className="profile-logout-section">
        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={isLoading}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}

