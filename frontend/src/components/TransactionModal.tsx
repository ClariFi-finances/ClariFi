import { useMemo, useState } from 'react'
import './TransactionModal.css'

export interface TransactionModalCategoryOption {
  value: string
  label: string
}

export interface TransactionModalPaymentMethod {
  id: number
  name: string
}

export interface TransactionModalGoalOption {
  id: number
  name: string
  icon: string | null
}

interface TransactionModalProps {
  isOpen: boolean
  mode: 'income' | 'expense'
  categories: TransactionModalCategoryOption[]
  paymentMethods: TransactionModalPaymentMethod[]
  goals?: TransactionModalGoalOption[]
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: {
    title: string
    description: string
    amount: number
    date: string
    category: string
    paymentMethodId: number
    installmentInfo?: string
    goalId?: number
  }) => Promise<void>
  t: (key: string, defaultValue?: string) => string
}

export function TransactionModal({
  isOpen,
  mode,
  categories,
  paymentMethods,
  goals = [],
  isSubmitting,
  error,
  onClose,
  onSubmit,
  t,
}: TransactionModalProps) {
  const initialDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] ?? ''
  }, [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(initialDate)
  const [category, setCategory] = useState(categories[0]?.value ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id.toString() ?? '')
  const [installmentInfo, setInstallmentInfo] = useState('')
  const [goalId, setGoalId] = useState('')

  const primaryLabel = mode === 'income' ? t('home.income') : t('home.expense')

  const isFormValid = useMemo(() => {
    const parsedAmount = Number(amount)
    return (
      title.trim().length > 0 &&
      !Number.isNaN(parsedAmount) &&
      parsedAmount > 0 &&
      Boolean(date) &&
      Boolean(category) &&
      Boolean(paymentMethodId)
    )
  }, [amount, category, date, paymentMethodId, title])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid) {
      return
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      amount: Number(amount),
      date,
      category,
      paymentMethodId: Number(paymentMethodId),
      installmentInfo: installmentInfo.trim() || undefined,
      goalId: goalId ? Number(goalId) : undefined,
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className={`modal-card ${mode}`} role="dialog" aria-modal="true" aria-label={primaryLabel}>
        <div className="modal-header">
          <div>
            <p className="modal-tag">{primaryLabel}</p>
            <h2 className="modal-title">{t('home.transactionTitle')}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>{t('home.fieldTitle')}</span>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder={t('home.fieldTitlePlaceholder')}
              required
            />
          </label>

          <label className="modal-field">
            <span>{t('home.fieldDescription')}</span>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder={t('home.fieldDescriptionPlaceholder')}
              rows={3}
            />
          </label>

          <div className="modal-row">
            <label className="modal-field">
              <span>{t('home.fieldAmount')}</span>
              <input
                value={amount}
                onChange={event => setAmount(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder={t('home.fieldAmountPlaceholder')}
                required
              />
            </label>
            <label className="modal-field">
              <span>{t('home.fieldDate')}</span>
              <input
                value={date}
                onChange={event => setDate(event.target.value)}
                type="date"
                required
              />
            </label>
          </div>

          <div className="modal-row">
            <label className="modal-field">
              <span>{t('home.fieldCategory')}</span>
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                required
              >
                {categories.length === 0 ? (
                  <option value="">{t('home.noCategories')}</option>
                ) : (
                  categories.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="modal-field">
              <span>{t('home.fieldPayment')}</span>
              <select
                value={paymentMethodId}
                onChange={event => setPaymentMethodId(event.target.value)}
                required
              >
                {paymentMethods.length === 0 ? (
                  <option value="">{t('home.noPaymentMethods')}</option>
                ) : (
                  paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          <label className="modal-field">
            <span>{t('home.fieldInstallment')}</span>
            <input
              value={installmentInfo}
              onChange={event => setInstallmentInfo(event.target.value)}
              placeholder={t('home.fieldInstallmentPlaceholder')}
            />
          </label>

          {mode === 'income' && goals.length > 0 && (
            <label className="modal-field goal-field">
              <span>{t('home.fieldGoal')}</span>
              <select
                value={goalId}
                onChange={event => setGoalId(event.target.value)}
              >
                <option value="">{t('home.noGoal')}</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.icon || '🎯'} {goal.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error ? <p className="modal-error">{error}</p> : null}

          <div className="modal-actions">
            <button className="ghost-btn" type="button" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className="primary-btn" type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? t('home.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
