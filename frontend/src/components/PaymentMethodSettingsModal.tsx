import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, CreditCard, Wallet, Landmark } from 'lucide-react'
import { getAuthHeaders } from '@/config/api'
import { apiRequest, getErrorMessage } from '@/utils/apiClient'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import './PaymentMethodSettingsModal.css'

export interface PaymentMethod {
  id: number
  name: string
  type: number // 0 = Credit, 1 = Debit, 2 = Cash
  userId: number
}

interface PaymentMethodSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentMethodSettingsModal({ isOpen, onClose }: PaymentMethodSettingsModalProps) {
  const { user, token } = useAuth()
  const { t } = useI18n()
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<number>(0) // Default to Credit
  const [nameTouched, setNameTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)

  const nameError = useMemo(() => {
    if (!nameTouched) return null
    if (!newName.trim()) return t('validation.name.required')
    return null
  }, [newName, nameTouched, t])

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  useEffect(() => {
    if (!isOpen) return

    const loadPaymentMethods = async () => {
      setIsLoading(true)
      setError(null)
      if (!user) {
        setPaymentMethods([])
        setIsLoading(false)
        return
      }
      try {
        const data = await apiRequest<PaymentMethod[]>(`/paymentmethods?userId=${user.id}`, { headers })
        setPaymentMethods(data)
      } catch (err) {
        setError(getErrorMessage(err, t('paymentMethodModal.unknownError', 'Erro desconhecido')))
      } finally {
        setIsLoading(false)
      }
    }

    loadPaymentMethods()
  }, [isOpen, headers, user, t])

  // Focus input when form opens
  useEffect(() => {
    if (isFormOpen && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isFormOpen])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('paymentMethodModal.confirmDelete', 'Tem certeza que deseja excluir este método de pagamento?'))) return

    setIsDeleting(id)
    setError(null)
    
    try {
      await apiRequest<void>(`/paymentmethods/${id}/remove`, { method: 'DELETE', headers })
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, t('paymentMethodModal.deleteError', 'Erro ao excluir')))
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameTouched(true)
    if (!newName.trim() || !user) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      const isEditing = !!editingPaymentMethod
      const url = isEditing 
        ? `/paymentmethods/${editingPaymentMethod.id}/update-details`
        : '/paymentmethods/add'

      const payload = isEditing 
        ? {
            name: newName.trim(),
            type: newType,
          }
        : {
            name: newName.trim(),
            type: newType,
            userId: user.id,
          }

      if (isEditing) {
        await apiRequest<void>(url, {
          method: 'PUT',
          headers,
          body: payload,
        })
        setPaymentMethods(prev =>
          prev.map(pm =>
            pm.id === editingPaymentMethod.id
              ? { ...pm, name: payload.name, type: payload.type }
              : pm,
          ),
        )
      } else {
        const createdPm = await apiRequest<PaymentMethod>(url, {
          method: 'POST',
          headers,
          body: payload,
        })
        setPaymentMethods(prev => [...prev, createdPm])
      }
      
      setNewName('')
      setNewType(0)
      setNameTouched(false)
      setEditingPaymentMethod(null)
      setIsFormOpen(false)
    } catch (err) {
      setError(getErrorMessage(err, t('paymentMethodModal.saveError', 'Erro ao salvar')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: number) => {
    const typeNum = Number(type)
    if (typeNum === 0) return <CreditCard size={18} className="pm-type-icon credit" />
    if (typeNum === 1) return <Landmark size={18} className="pm-type-icon debit" />
    return <Wallet size={18} className="pm-type-icon cash" />
  }

  const getTypeName = (type: number) => {
    const typeNum = Number(type)
    if (typeNum === 0) return t('paymentMethodModal.typeCredit', 'Crédito')
    if (typeNum === 1) return t('paymentMethodModal.typeDebit', 'Débito')
    return t('paymentMethodModal.typeCash', 'Dinheiro/Outro')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card pm-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="modal-tag">{t('paymentMethodModal.tag', 'FINANÇAS')}</p>
            <h2 className="modal-title">{t('paymentMethodModal.title', 'Métodos de Pagamento')}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="pm-list">
          {isLoading ? (
            <p className="loading-text">{t('common.loading', 'Carregando...')}</p>
          ) : paymentMethods.length === 0 ? (
            <p className="empty-text">{t('paymentMethodModal.empty', 'Nenhum método de pagamento encontrado.')}</p>
          ) : (
            paymentMethods.map(pm => (
              <div key={pm.id} className="pm-item">
                <div className="pm-item-info">
                  {getTypeIcon(pm.type)}
                  <div className="pm-meta">
                    <span className="pm-name">{pm.name}</span>
                    <span className={`pm-badge type-${pm.type}`}>
                      {getTypeName(pm.type)}
                    </span>
                  </div>
                </div>
                <div className="pm-actions">
                  <button 
                    type="button" 
                    className="icon-btn edit-btn"
                    onClick={() => {
                      setEditingPaymentMethod(pm)
                      setNewName(pm.name)
                      setNewType(Number(pm.type))
                      setNameTouched(false)
                      setIsFormOpen(true)
                    }}
                    title={t('common.edit', 'Editar')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(pm.id)}
                    title={t('paymentMethodModal.deleteTooltip', 'Excluir')}
                    disabled={isDeleting === pm.id}
                  >
                    {isDeleting === pm.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isFormOpen ? (
          <button 
            type="button" 
            className="primary-btn add-pm-trigger"
            onClick={() => {
              setEditingPaymentMethod(null)
              setNewName('')
              setNewType(0)
              setNameTouched(false)
              setIsFormOpen(true)
            }}
          >
            <Plus size={18} />
            {t('paymentMethodModal.addBtn', 'Adicionar Método')}
          </button>
        ) : (
          <form className="add-pm-form" onSubmit={handleAddEditSubmit}>
            <div className="form-fields">
              <div className="field-group">
                <input
                  ref={nameInputRef}
                  type="text"
                  className={`name-input ${nameError ? 'form-input-error' : ''}`}
                  placeholder={t('paymentMethodModal.newPaymentMethodPlaceholder', 'Novo método...')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  disabled={isSubmitting}
                  required
                />
                {nameError && <span className="form-error-msg">⚠️ {nameError}</span>}
              </div>

              <div className="payment-type-selector">
                <span className="field-label">{t('paymentMethodModal.typeLabel', 'Tipo')}:</span>
                <div className="type-chips">
                  <button
                    type="button"
                    className={`type-chip ${newType === 0 ? 'active' : ''}`}
                    onClick={() => setNewType(0)}
                    disabled={isSubmitting}
                  >
                    <CreditCard size={14} />
                    <span>{t('paymentMethodModal.typeCredit', 'Crédito')}</span>
                  </button>
                  <button
                    type="button"
                    className={`type-chip ${newType === 1 ? 'active' : ''}`}
                    onClick={() => setNewType(1)}
                    disabled={isSubmitting}
                  >
                    <Landmark size={14} />
                    <span>{t('paymentMethodModal.typeDebit', 'Débito')}</span>
                  </button>
                  <button
                    type="button"
                    className={`type-chip ${newType === 2 ? 'active' : ''}`}
                    onClick={() => setNewType(2)}
                    disabled={isSubmitting}
                  >
                    <Wallet size={14} />
                    <span>{t('paymentMethodModal.typeCash', 'Dinheiro/Outro')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn add-btn" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {editingPaymentMethod ? t('common.save', 'Salvar') : t('common.add', 'Adicionar')}
              </button>
              <button 
                type="button" 
                className="secondary-btn cancel-btn"
                onClick={() => {
                  setIsFormOpen(false)
                  setNameTouched(false)
                }}
                disabled={isSubmitting}
              >
                <X size={16} />
                {t('common.cancel', 'Cancelar')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
