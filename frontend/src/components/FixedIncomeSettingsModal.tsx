import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { getAuthHeaders } from '@/config/api'
import { apiRequest, getErrorMessage } from '@/utils/apiClient'
import { useAuth } from '@/context/useAuth'
import { useI18n } from '@/hooks/useI18n'
import './FixedIncomeSettingsModal.css'

export interface FixedIncome {
  id: number
  name: string
  amount: number
  dayOfMonth: number
  createdAt: string
  userId: number
}

interface FixedIncomeSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FixedIncomeSettingsModal({ isOpen, onClose }: FixedIncomeSettingsModalProps) {
  const { user, token } = useAuth()
  const { t } = useI18n()
  const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDay, setNewDay] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<FixedIncome | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  useEffect(() => {
    if (!isOpen) return

    const loadFixedIncomes = async () => {
      setIsLoading(true)
      setError(null)
      if (!user) {
        setFixedIncomes([])
        setIsLoading(false)
        return
      }
      try {
        const data = await apiRequest<FixedIncome[]>(`/fixedincomes?userId=${user.id}`, { headers })
        setFixedIncomes(data)
      } catch (err) {
        setError(getErrorMessage(err, t('fixedIncomeModal.unknownError', 'Erro desconhecido')))
      } finally {
        setIsLoading(false)
      }
    }

    loadFixedIncomes()
  }, [isOpen, headers, user, t])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('fixedIncomeModal.confirmDelete', 'Tem certeza que deseja excluir esta receita fixa?'))) return

    setIsDeleting(id)
    setError(null)
    
    try {
      await apiRequest<void>(`/fixedincomes/${id}/remove`, { method: 'DELETE', headers })
      setFixedIncomes(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, t('fixedIncomeModal.deleteError', 'Erro ao excluir')))
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newAmount || !newDay || !user) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      const isEditing = !!editingItem
      const url = isEditing 
        ? `/fixedincomes/${editingItem.id}/update`
        : '/fixedincomes/add'

      const amountParsed = parseFloat(newAmount)
      const dayParsed = parseInt(newDay, 10)

      if (isNaN(amountParsed) || isNaN(dayParsed) || dayParsed < 1 || dayParsed > 31) {
          throw new Error(t('fixedIncomeModal.invalidData', 'Dados inválidos. Verifique o valor e o dia.'));
      }
        
      const payload = isEditing 
        ? {
            name: newName.trim(),
            amount: amountParsed,
            dayOfMonth: dayParsed
          }
        : {
            name: newName.trim(),
            amount: amountParsed,
            dayOfMonth: dayParsed,
            userId: user.id,
          }

      if (isEditing) {
        await apiRequest<void>(url, {
          method: 'PUT',
          headers,
          body: payload,
        })
        setFixedIncomes(prev =>
          prev.map(item =>
            item.id === editingItem.id
              ? { ...item, name: payload.name, amount: payload.amount, dayOfMonth: payload.dayOfMonth }
              : item,
          ),
        )
      } else {
        const createdItem = await apiRequest<FixedIncome>(url, {
          method: 'POST',
          headers,
          body: payload,
        })
        setFixedIncomes(prev => [...prev, createdItem])
      }
      
      resetForm()
    } catch (err) {
      setError(getErrorMessage(err, t('fixedIncomeModal.saveError', 'Erro ao salvar')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setNewName('')
    setNewAmount('')
    setNewDay('1')
    setEditingItem(null)
    setIsFormOpen(false)
  }

  const openEditForm = (item: FixedIncome) => {
    setEditingItem(item)
    setNewName(item.name)
    setNewAmount(item.amount.toString())
    setNewDay(item.dayOfMonth.toString())
    setIsFormOpen(true)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card fixed-income-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="modal-tag">{t('fixedIncomeModal.tag', 'FINANÇAS')}</p>
            <h2 className="modal-title">{t('fixedIncomeModal.title', 'Receitas Fixas')}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="fixed-income-list">
          {isLoading ? (
            <p className="loading-text">{t('common.loading', 'Carregando...')}</p>
          ) : fixedIncomes.length === 0 ? (
            <p className="empty-text">{t('fixedIncomeModal.empty', 'Nenhuma receita fixa cadastrada.')}</p>
          ) : (
            fixedIncomes.map(item => (
              <div key={item.id} className="fixed-income-item">
                <div className="fixed-income-info">
                  <span className="fixed-income-name">{item.name}</span>
                  <div className="fixed-income-details">
                    <span className="fixed-income-amount">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                    </span>
                    <span>• {t('fixedIncomeModal.day', 'Dia')} {item.dayOfMonth}</span>
                  </div>
                </div>
                <div className="fixed-income-actions">
                  <button 
                    type="button" 
                    className="icon-btn edit-btn"
                    onClick={() => openEditForm(item)}
                    title={t('common.edit', 'Editar')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(item.id)}
                    title={t('common.delete', 'Excluir')}
                    disabled={isDeleting === item.id}
                  >
                    {isDeleting === item.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isFormOpen ? (
          <button 
            type="button" 
            className="primary-btn"
            onClick={() => {
              resetForm()
              setIsFormOpen(true)
            }}
          >
            <Plus size={18} />
            {t('fixedIncomeModal.addBtn', 'Adicionar Receita')}
          </button>
        ) : (
          <form className="add-fixed-income-form" onSubmit={handleAddEditSubmit}>
            <div className="form-group">
                <label>{t('fixedIncomeModal.nameLabel', 'Nome (ex: Salário)')}</label>
                <input
                    type="text"
                    placeholder={t('fixedIncomeModal.namePlaceholder', 'Nome da receita')}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={isSubmitting}
                    required
                />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>{t('fixedIncomeModal.amountLabel', 'Valor (R$)')}</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>{t('fixedIncomeModal.dayLabel', 'Dia do Mês (1-31)')}</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="5"
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-btn cancel-btn"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                <X size={16} />
                {t('common.cancel', 'Cancelar')}
              </button>
              <button type="submit" className="primary-btn add-btn" disabled={isSubmitting || !newName.trim() || !newAmount || !newDay}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {editingItem ? t('common.save', 'Salvar') : t('common.add', 'Adicionar')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
