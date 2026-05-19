import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, X, Target, Calendar } from 'lucide-react'
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react'
import { useAuth } from '@/context/useAuth'
import { getAuthHeaders } from '@/config/api'
import { apiRequest, getErrorMessage } from '@/utils/apiClient'
import { useI18n } from '@/hooks/useI18n'
import './GoalsScreen.css'

interface ApiGoal {
  id: number
  name: string
  icon: string | null
  color: string | null
  targetAmount: number
  currentAmount: number
  deadline: string | null
  createdAt: string
  userId: number
}

type ModalType = 'create' | 'deposit' | 'withdraw' | null

const COLOR_OPTIONS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F43F5E', '#6366F1',
]

export function GoalsScreen() {
  const { user, token } = useAuth()
  const { t, language } = useI18n()

  const [goals, setGoals] = useState<ApiGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedGoal, setSelectedGoal] = useState<ApiGoal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('🎯')
  const [formColor, setFormColor] = useState('#F59E0B')
  const [formTarget, setFormTarget] = useState('')
  const [formInitial, setFormInitial] = useState('')
  const [formDeadline, setFormDeadline] = useState('')

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Transaction form state
  const [transactionAmount, setTransactionAmount] = useState('')

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  const formatter = useMemo(() => {
    const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' })
  }, [language])

  const dateFormatter = useMemo(() => {
    const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })
  }, [language])

  const formatCurrency = (val: number) => formatter.format(val)

  // Load goals
  useEffect(() => {
    if (!user) return
    let isActive = true
    const loadGoals = async () => {
      setIsLoading(true)
      try {
        const data = await apiRequest<ApiGoal[]>(`/goals?userId=${user.id}`, { headers })
        if (isActive) setGoals(data)
      } catch (err) {
        if (isActive) setError(getErrorMessage(err, t('common.error')))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    loadGoals()
    return () => { isActive = false }
  }, [headers, t, user])

  const userGoals = useMemo(() => {
    if (!user) return []
    return goals.filter(g => g.userId === user.id)
  }, [goals, user])

  // Summary calculations
  const summary = useMemo(() => {
    const totalSaved = userGoals.reduce((sum, g) => sum + g.currentAmount, 0)
    const totalTarget = userGoals.reduce((sum, g) => sum + g.targetAmount, 0)
    const completedCount = userGoals.filter(g => g.currentAmount >= g.targetAmount).length
    return { totalSaved, totalTarget, completedCount, totalGoals: userGoals.length }
  }, [userGoals])

  // Modal helpers
  const openCreateModal = () => {
    setFormName('')
    setFormIcon('🎯')
    setFormColor('#F59E0B')
    setFormTarget('')
    setFormInitial('')
    setFormDeadline('')
    setModalError(null)
    setModalType('create')
  }

  const openDepositModal = (goal: ApiGoal) => {
    setSelectedGoal(goal)
    setTransactionAmount('')
    setModalError(null)
    setModalType('deposit')
  }

  const openWithdrawModal = (goal: ApiGoal) => {
    setSelectedGoal(goal)
    setTransactionAmount('')
    setModalError(null)
    setModalType('withdraw')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedGoal(null)
    setModalError(null)
  }

  // Create goal
  const handleCreate = async () => {
    if (!user || !formName.trim() || !formTarget) return
    setIsSubmitting(true)
    setModalError(null)
    try {
      const newGoal = await apiRequest<ApiGoal>('/goals/add', {
        method: 'POST',
        headers,
        body: {
          name: formName.trim(),
          icon: formIcon || '🎯',
          color: formColor,
          targetAmount: parseFloat(formTarget),
          currentAmount: formInitial ? parseFloat(formInitial) : 0,
          deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
          userId: user.id,
        },
      })
      setGoals(prev => [...prev, newGoal])
      closeModal()
    } catch (err) {
      setModalError(getErrorMessage(err, t('goals.createError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deposit / Withdraw
  const handleGoalTransaction = async () => {
    if (!selectedGoal || !transactionAmount) return
    const amount = parseFloat(transactionAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsSubmitting(true)
    setModalError(null)
    const endpoint = modalType === 'deposit' ? 'deposit' : 'withdraw'
    try {
      const updated = await apiRequest<ApiGoal>(`/goals/${selectedGoal.id}/${endpoint}`, {
        method: 'POST',
        headers,
        body: { amount },
      })
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
      closeModal()
    } catch (err) {
      setModalError(getErrorMessage(err, t('goals.transactionError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete goal
  const handleDelete = async (goalId: number) => {
    if (!confirm(t('goals.confirmDelete'))) return
    try {
      await apiRequest(`/goals/${goalId}/remove`, { method: 'DELETE', headers })
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch (err) {
      alert(getErrorMessage(err, t('goals.deleteError')))
    }
  }

  const getProgress = (goal: ApiGoal) => {
    if (goal.targetAmount <= 0) return 100
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
  }

  const isCompleted = (goal: ApiGoal) => goal.currentAmount >= goal.targetAmount

  return (
    <div className="goals-screen">
      <header className="goals-screen-header">
        <div>
          <h1>{t('goals.title')}</h1>
          <p className="goals-screen-subtitle">{t('goals.subtitle')}</p>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={openCreateModal}
          style={{ borderRadius: 16, padding: '10px 18px', background: 'var(--accent-gold-dark)', color: '#000', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
        >
          <Plus size={18} />
          {t('goals.newGoal')}
        </button>
      </header>

      {/* Summary Cards */}
      {userGoals.length > 0 && (
        <div className="goals-summary">
          <div className="summary-card">
            <span className="summary-label">{t('goals.saved')}</span>
            <span className="summary-value accent">{formatCurrency(summary.totalSaved)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">{t('goals.target')}</span>
            <span className="summary-value">{formatCurrency(summary.totalTarget)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">{t('goals.progress')}</span>
            <span className="summary-value">
              {summary.completedCount}/{summary.totalGoals}
            </span>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('goals.loading')}</p>
      ) : error ? (
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      ) : userGoals.length === 0 ? (
        <div className="goals-empty-state">
          <div className="goals-empty-icon">🎯</div>
          <p>{t('goals.empty')}</p>
          <button
            type="button"
            onClick={openCreateModal}
            style={{ padding: '12px 24px', borderRadius: 16, border: 'none', background: 'var(--accent-gold-dark)', color: '#000', fontWeight: 700, cursor: 'pointer' }}
          >
            {t('goals.newGoal')}
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {userGoals.map(goal => {
            const progress = getProgress(goal)
            const done = isCompleted(goal)

            return (
              <div
                key={goal.id}
                className={`goal-card ${done ? 'completed' : ''}`}
                style={{ '--goal-color': goal.color || '#F59E0B' } as React.CSSProperties}
              >
                <div className="goal-card-top">
                  <div className="goal-card-icon">{goal.icon || '🎯'}</div>
                  <div className="goal-card-actions">
                    <button
                      className="goal-action-btn danger"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(goal.id) }}
                      title={t('goals.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="goal-card-info">
                  <span className="goal-card-name">{goal.name}</span>
                  <span className="goal-card-deadline">
                    <Calendar size={12} />
                    {goal.deadline
                      ? dateFormatter.format(new Date(goal.deadline))
                      : t('goals.noDeadline')
                    }
                  </span>
                </div>

                <div className="goal-progress-container">
                  <div className="goal-progress-bar">
                    <div
                      className={`goal-progress-fill ${done ? 'completed' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="goal-progress-details">
                    <div>
                      <span className="goal-progress-amount">{formatCurrency(goal.currentAmount)}</span>
                      <span className="goal-progress-target"> / {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    {done ? (
                      <span className="goal-completed-badge">{t('goals.completed')}</span>
                    ) : (
                      <span className="goal-progress-percent">{progress.toFixed(0)}%</span>
                    )}
                  </div>
                </div>

                <div className="goal-card-btns">
                  <button
                    className="goal-deposit-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openDepositModal(goal) }}
                  >
                    <ArrowUpCircle size={16} />
                    {t('goals.deposit')}
                  </button>
                  <button
                    className="goal-withdraw-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openWithdrawModal(goal) }}
                    disabled={goal.currentAmount <= 0}
                  >
                    <ArrowDownCircle size={16} />
                    {t('goals.withdraw')}
                  </button>
                </div>
              </div>
            )
          })}

          {/* New Goal Card (dashed) */}
          <button type="button" className="new-goal-btn" onClick={openCreateModal}>
            <div className="new-goal-icon">
              <Plus size={28} />
            </div>
            <span className="new-goal-label">{t('goals.newGoal')}</span>
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {modalType === 'create' && (
        <div className="goals-modal-overlay" onClick={closeModal}>
          <div className="goals-modal" onClick={e => e.stopPropagation()}>
            <div className="goals-modal-header">
              <span className="goals-modal-title">{t('goals.create.title')}</span>
              <button className="goals-modal-close" type="button" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            {modalError && <div className="goals-form-error">{modalError}</div>}

            <div className="goals-form-group">
              <label className="goals-form-label">{t('goals.create.name')}</label>
              <input
                className="goals-form-input"
                placeholder={t('goals.create.namePlaceholder')}
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            <div className="goals-form-row">
              <div className="goals-form-group">
                <label className="goals-form-label">{t('goals.create.icon')}</label>
                <div className="goals-emoji-picker-container">
                  <button
                    type="button"
                    className="goals-emoji-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {formIcon}
                  </button>
                  {showEmojiPicker && (
                    <div className="goals-emoji-picker-dropdown">
                      <EmojiPicker
                        theme={Theme.DARK}
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          setFormIcon(emojiData.emoji)
                          setShowEmojiPicker(false)
                        }}
                        width={300}
                        height={350}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="goals-form-group">
                <label className="goals-form-label">{t('goals.create.color')}</label>
                <div className="color-options">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="goals-form-row">
              <div className="goals-form-group">
                <label className="goals-form-label">{t('goals.create.targetAmount')}</label>
                <input
                  className="goals-form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t('goals.create.targetAmountPlaceholder')}
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                />
              </div>
              <div className="goals-form-group">
                <label className="goals-form-label">{t('goals.create.initialAmount')}</label>
                <input
                  className="goals-form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t('goals.create.initialAmountPlaceholder')}
                  value={formInitial}
                  onChange={e => setFormInitial(e.target.value)}
                />
              </div>
            </div>

            <div className="goals-form-group">
              <label className="goals-form-label">{t('goals.create.deadline')}</label>
              <input
                className="goals-form-input"
                type="date"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
              />
            </div>

            <button
              className="goals-form-submit"
              type="button"
              disabled={isSubmitting || !formName.trim() || !formTarget}
              onClick={handleCreate}
            >
              {isSubmitting ? t('goals.create.submitting') : t('goals.create.submit')}
            </button>
          </div>
        </div>
      )}

      {/* DEPOSIT / WITHDRAW MODAL */}
      {(modalType === 'deposit' || modalType === 'withdraw') && selectedGoal && (
        <div className="goals-modal-overlay" onClick={closeModal}>
          <div className="goals-modal" onClick={e => e.stopPropagation()}>
            <div className="goals-modal-header">
              <span className="goals-modal-title">
                {modalType === 'deposit'
                  ? t('goals.transaction.depositTitle')
                  : t('goals.transaction.withdrawTitle')
                }
              </span>
              <button className="goals-modal-close" type="button" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            {/* Goal context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 16 }}>
              <span style={{ fontSize: 24 }}>{selectedGoal.icon || '🎯'}</span>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: 14 }}>{selectedGoal.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
                </p>
              </div>
            </div>

            {modalError && <div className="goals-form-error">{modalError}</div>}

            <div className="goals-form-group">
              <label className="goals-form-label">{t('goals.transaction.amount')}</label>
              <input
                className="goals-form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder={t('goals.transaction.amountPlaceholder')}
                value={transactionAmount}
                onChange={e => setTransactionAmount(e.target.value)}
                autoFocus
              />
            </div>

            <button
              className="goals-form-submit"
              type="button"
              disabled={isSubmitting || !transactionAmount || parseFloat(transactionAmount) <= 0}
              onClick={handleGoalTransaction}
              style={modalType === 'withdraw' ? { background: '#EF4444' } : {}}
            >
              {isSubmitting ? t('goals.transaction.submitting') : t('goals.transaction.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
