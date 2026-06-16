import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  initialAmount?: string
  initialTitle?: string
  initialDate?: string
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
  t: (key: string, options?: any, defaultValue?: string) => string
}

export function TransactionModal({
  isOpen,
  mode,
  categories,
  paymentMethods,
  goals = [],
  initialAmount = '',
  initialTitle = '',
  initialDate = '',
  isSubmitting,
  error,
  onClose,
  onSubmit,
  t,
}: TransactionModalProps) {
  const defaultDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] ?? ''
  }, [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(initialAmount)
  const [date, setDate] = useState(defaultDate)
  const [category, setCategory] = useState(categories[0]?.value ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id.toString() ?? '')
  const [installmentInfo, setInstallmentInfo] = useState('')
  const [goalId, setGoalId] = useState('')

  const [titleTouched, setTitleTouched] = useState(false)
  const [amountTouched, setAmountTouched] = useState(false)
  const [dateTouched, setDateTouched] = useState(false)
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [paymentMethodIdTouched, setPaymentMethodIdTouched] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialAmount) setAmount(initialAmount)
      if (initialTitle) setTitle(initialTitle)
      if (initialDate) {
        setDate(initialDate)
      } else {
        setDate(defaultDate)
      }
    }
  }, [isOpen, initialAmount, initialTitle, initialDate, defaultDate])

  const primaryLabel = mode === 'income' ? t('home.income') : t('home.expense')

  const titleError = useMemo(() => {
    if (!titleTouched) return null
    if (!title.trim()) return t('validation.title.required')
    return null
  }, [title, titleTouched, t])

  const amountError = useMemo(() => {
    if (!amountTouched) return null
    if (!amount) return t('validation.amount.required')
    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return t('validation.amount.invalid')
    return null
  }, [amount, amountTouched, t])

  const dateError = useMemo(() => {
    if (!dateTouched) return null
    if (!date) return t('validation.date.required')
    return null
  }, [date, dateTouched, t])

  const categoryError = useMemo(() => {
    if (!categoryTouched) return null
    if (!category) return t('validation.category.required')
    return null
  }, [category, categoryTouched, t])

  const paymentMethodIdError = useMemo(() => {
    if (!paymentMethodIdTouched) return null
    if (!paymentMethodId) return t('validation.paymentMethod.required')
    return null
  }, [paymentMethodId, paymentMethodIdTouched, t])

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
    setTitleTouched(true)
    setAmountTouched(true)
    setDateTouched(true)
    setCategoryTouched(true)
    setPaymentMethodIdTouched(true)

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

  return createPortal(
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
              onBlur={() => setTitleTouched(true)}
              placeholder={t('home.fieldTitlePlaceholder')}
              className={titleError ? 'form-input-error' : ''}
              required
            />
            {titleError && <span className="form-error-msg">⚠️ {titleError}</span>}
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
                onBlur={() => setAmountTouched(true)}
                type="number"
                min="0"
                step="0.01"
                placeholder={t('home.fieldAmountPlaceholder')}
                className={amountError ? 'form-input-error' : ''}
                required
              />
              {amountError && <span className="form-error-msg">⚠️ {amountError}</span>}
            </label>
            <label className="modal-field">
              <span>{t('home.fieldDate')}</span>
              <input
                value={date}
                onChange={event => setDate(event.target.value)}
                onBlur={() => setDateTouched(true)}
                type="date"
                className={dateError ? 'form-input-error' : ''}
                required
              />
              {dateError && <span className="form-error-msg">⚠️ {dateError}</span>}
            </label>
          </div>

          <div className="modal-row">
            <label className="modal-field">
              <span>{t('home.fieldCategory')}</span>
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                onBlur={() => setCategoryTouched(true)}
                className={categoryError ? 'form-input-error' : ''}
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
              {categoryError && <span className="form-error-msg">⚠️ {categoryError}</span>}
            </label>
            <label className="modal-field">
              <span>{t('home.fieldPayment')}</span>
              <select
                value={paymentMethodId}
                onChange={event => setPaymentMethodId(event.target.value)}
                onBlur={() => setPaymentMethodIdTouched(true)}
                className={paymentMethodIdError ? 'form-input-error' : ''}
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
              {paymentMethodIdError && <span className="form-error-msg">⚠️ {paymentMethodIdError}</span>}
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
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('home.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
