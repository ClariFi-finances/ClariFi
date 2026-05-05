import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Bell, Camera, Plus } from 'lucide-react'
import { useApp } from '@/context/useApp'
import { useAuth } from '@/context/useAuth'
import { API_BASE_URL } from '@/config/api'
import { useI18n } from '@/hooks/useI18n'
import { TransactionModal } from '@/components/TransactionModal'
import './HomeScreen.css'

interface ApiTransaction {
  id: number
  title: string
  description: string
  amount: number
  date: string
  type: number | string
  categoryId: number
  userId: number
  paymentMethodId: number
  installmentInfo?: string | null
}

interface ApiCategory {
  id: number
  name: string
  icon?: string | null
  color?: string | null
  userId: number
}

interface ApiPaymentMethod {
  id: number
  name: string
  type: number | string
  userId: number
}

export function HomeScreen() {
  const { setActiveScreen } = useApp()
  const { user, token } = useAuth()
  const { t, language } = useI18n()
  const [showValues, setShowValues] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions'>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ApiPaymentMethod[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'income' | 'expense'>('income')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef<HTMLDivElement | null>(null)
  const quickMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const quickMenuFabRef = useRef<HTMLButtonElement | null>(null)

  const headers = useMemo(() => {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      baseHeaders['Authorization'] = `Bearer ${token}`
    }
    return baseHeaders
  }, [token])

  useEffect(() => {
    if (!user) {
      return
    }

    const controller = new AbortController()
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [transactionsResponse, paymentMethodsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions`, { signal: controller.signal, headers }),
          fetch(`${API_BASE_URL}/paymentmethods`, { signal: controller.signal, headers }),
          fetch(`${API_BASE_URL}/categories`, { signal: controller.signal, headers }),
        ])

        if (!transactionsResponse.ok || !paymentMethodsResponse.ok || !categoriesResponse.ok) {
          throw new Error(t('home.loadError'))
        }

        const transactionData = await transactionsResponse.json()
        const paymentMethodData = await paymentMethodsResponse.json()
        const categoriesData = await categoriesResponse.json()

        setTransactions(transactionData)
        setPaymentMethods(paymentMethodData)
        setCategories(categoriesData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : t('home.loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      controller.abort()
    }
  }, [headers, t, user])

  useEffect(() => {
    if (!isQuickMenuOpen) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      const isTriggerClick =
        (quickMenuButtonRef.current?.contains(target) ?? false) ||
        (quickMenuFabRef.current?.contains(target) ?? false)
      const isMenuClick = quickMenuRef.current?.contains(target) ?? false

      if (!isTriggerClick && !isMenuClick) {
        setIsQuickMenuOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isQuickMenuOpen])

  const userTransactions = useMemo(() => {
    if (!user) {
      return []
    }
    return transactions.filter(transaction => transaction.userId === user.id)
  }, [transactions, user])

  const userPaymentMethods = useMemo(() => {
    if (!user) {
      return []
    }
    return paymentMethods.filter(method => method.userId === user.id)
  }, [paymentMethods, user])

  const userCategories = useMemo(() => {
    if (!user) {
      return []
    }
    return categories.filter(category => category.userId === user.id)
  }, [categories, user])

  const sortedTransactions = useMemo(() => {
    return [...userTransactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [userTransactions])

  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  const monthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 1), [now])

  const currentMonthTransactions = useMemo(() =>
    sortedTransactions.filter(transaction => {
      const date = new Date(transaction.date)
      return date >= monthStart && date < monthEnd
    }),
  [monthEnd, monthStart, sortedTransactions])

  const totals = useMemo(() => {
    const income = currentMonthTransactions
      .filter(transaction => transaction.type === 0 || transaction.type === 'Income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const expense = currentMonthTransactions
      .filter(transaction => transaction.type === 1 || transaction.type === 'Expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [currentMonthTransactions])

  const previousMonthTotals = useMemo(() => {
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousEnd = monthStart
    const previousTransactions = sortedTransactions.filter(transaction => {
      const date = new Date(transaction.date)
      return date >= previousStart && date < previousEnd
    })

    const expense = previousTransactions
      .filter(transaction => transaction.type === 1 || transaction.type === 'Expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return { expense }
  }, [monthStart, now, sortedTransactions])

  const categoryTotals = useMemo(() => {
    const grouped = currentMonthTransactions
      .filter(transaction => transaction.type === 1 || transaction.type === 'Expense')
      .reduce<Record<string, number>>((acc, transaction) => {
        const categoryName = userCategories.find(c => c.id === transaction.categoryId)?.name ?? String(transaction.categoryId)
        acc[categoryName] = (acc[categoryName] ?? 0) + transaction.amount
        return acc
      }, {})

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
  }, [currentMonthTransactions])

  const availableCategories = useMemo(() => {
    return userCategories.map(c => ({ value: String(c.id), label: c.name }))
  }, [userCategories])

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return sortedTransactions
    }

    return sortedTransactions.filter(transaction => {
      const categoryName = userCategories.find(c => c.id === transaction.categoryId)?.name ?? String(transaction.categoryId)
      return transaction.title.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query)
    })
  }, [sortedTransactions, searchQuery])

  const formatter = useMemo(() => {
    const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' })
  }, [language])

  const monthFormatter = useMemo(() => {
    const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  }, [language])

  const currentMonthLabel = useMemo(() => monthFormatter.format(now), [monthFormatter, now])

  const formatCurrency = (value: number) => (showValues ? formatter.format(value) : '••••••')
  const formatPercent = (value: number) => (showValues ? `${value.toFixed(0)}%` : '••')

  const budgetRatio = totals.income > 0 ? Math.min(100, (totals.expense / totals.income) * 100) : 0
  const isOverBudget = totals.expense > totals.income

  const expenseDelta = previousMonthTotals.expense > 0
    ? ((totals.expense - previousMonthTotals.expense) / previousMonthTotals.expense) * 100
    : 0
  const deltaLabel = expenseDelta <= 0 ? t('home.deltaLess') : t('home.deltaMore')
  const deltaValue = `${Math.abs(expenseDelta).toFixed(0)}% ${deltaLabel}`
  const savedValue = previousMonthTotals.expense > totals.expense
    ? previousMonthTotals.expense - totals.expense
    : 0

  const modalKey = useMemo(
    () => `${modalMode}-${availableCategories.length}-${userPaymentMethods.length}`,
    [availableCategories.length, modalMode, userPaymentMethods.length],
  )

  const openModal = (mode: 'income' | 'expense') => {
    setModalMode(mode)
    setModalError(null)
    setIsModalOpen(true)
    setIsQuickMenuOpen(false)
  }

  const handleCreateTransaction = async (payload: {
    title: string
    description: string
    amount: number
    date: string
    category: string
    paymentMethodId: number
    installmentInfo?: string
  }) => {
    if (!user) {
      return
    }

    setIsSubmitting(true)
    setModalError(null)
    try {
      const parsedCategory = Number.isNaN(Number(payload.category))
        ? payload.category
        : Number(payload.category)
      const response = await fetch(`${API_BASE_URL}/transactions/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          amount: payload.amount,
          date: new Date(payload.date).toISOString(),
          type: modalMode === 'income' ? 0 : 1,
          categoryId: parsedCategory,
          userId: user.id,
          paymentMethodId: payload.paymentMethodId,
          installmentInfo: payload.installmentInfo ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(t('home.saveError'))
      }

      const newTransaction = await response.json()
      setTransactions(prev => [newTransaction, ...prev])
      setIsModalOpen(false)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : t('home.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="greeting">{t('home.greeting')}</p>
          <h1>{t('home.welcome')}</h1>
          <p className="dashboard-date">{currentMonthLabel}</p>
        </div>
        <div className="header-actions">
          <button
            className="ghost-btn"
            onClick={() => setShowValues(value => !value)}
            type="button"
          >
            {showValues ? t('home.hideValues') : t('home.showValues')}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => setIsQuickMenuOpen(value => !value)}
            ref={quickMenuButtonRef}
          >
            <Plus size={18} />
            {t('home.newTransaction')}
          </button>
          <button className="notification-btn" type="button" aria-label={t('home.notification')}>
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="view-tabs" role="tablist">
        <button
          className={`view-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
          type="button"
          role="tab"
          aria-selected={activeView === 'dashboard'}
        >
          {t('home.tabDashboard')}
        </button>
        <button
          className={`view-tab ${activeView === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveView('transactions')}
          type="button"
          role="tab"
          aria-selected={activeView === 'transactions'}
        >
          {t('home.tabTransactions')}
        </button>
      </div>

      {isQuickMenuOpen ? (
        <div className="quick-menu" ref={quickMenuRef} role="menu">
          <button className="quick-menu-item" type="button" onClick={() => openModal('income')}>
            <ArrowUpCircle size={18} className="quick-menu-icon" />
            <span>{t('home.income')}</span>
          </button>
          <button className="quick-menu-item danger" type="button" onClick={() => openModal('expense')}>
            <ArrowDownCircle size={18} className="quick-menu-icon" />
            <span>{t('home.expense')}</span>
          </button>
          <button className="quick-menu-item" type="button" disabled>
            <Camera size={18} className="quick-menu-icon" />
            <span>{t('home.scan')}</span>
            <span className="quick-menu-hint">{t('home.scanDisabled')}</span>
          </button>
        </div>
      ) : null}

      <button
        className="quick-fab"
        type="button"
        onClick={() => setIsQuickMenuOpen(value => !value)}
        aria-label={t('home.newTransaction')}
        ref={quickMenuFabRef}
      >
        <Plus size={24} />
      </button>

      {activeView === 'dashboard' ? (
        <section className="view-panel fade-in" role="tabpanel">
          <div className="dashboard-grid">
            <div className="card stat-card span-3">
              <p className="card-label">{t('home.availableBalance')}</p>
              <h2 className="stat-value">{formatCurrency(totals.balance)}</h2>
            </div>
            <div className="card stat-card span-3">
              <p className="card-label">{t('home.revenue')}</p>
              <h2 className="stat-value positive">{formatCurrency(totals.income)}</h2>
            </div>
            <div className="card stat-card span-3">
              <p className="card-label">{t('home.expenses')}</p>
              <h2 className="stat-value negative">{formatCurrency(totals.expense)}</h2>
            </div>
            <div className="card stat-card span-3">
              <p className="card-label">{t('home.spendingVsIncome')}</p>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${budgetRatio}%` }} />
              </div>
              <span className="progress-value">{formatPercent(budgetRatio)}</span>
            </div>

            {isOverBudget ? (
              <div className="budget-alert span-12" role="status" aria-live="polite">
                <span className="budget-alert-dot" />
                <div>
                  <p className="budget-alert-title">{t('home.budgetAlert')}</p>
                  <p className="budget-alert-text">{t('home.budgetAlertText')}</p>
                </div>
              </div>
            ) : null}

            <div className="card span-8">
              <div className="card-header">
                <h3>{t('home.monthSummary')}</h3>
              </div>
              <div className="chart-placeholder">
                <div className="chart-line income" />
                <div className="chart-line expense" />
              </div>
              <div className="chart-legend">
                <span className="legend-item income">{t('home.revenue')}</span>
                <span className="legend-item expense">{t('home.expenses')}</span>
              </div>
            </div>

            <div className="card span-4">
              <div className="card-header">
                <h3>{t('home.spendingByCategory')}</h3>
              </div>
              <div className="category-list">
                {categoryTotals.length === 0 ? (
                  <p className="empty-state">{t('home.emptyCategories')}</p>
                ) : (
                  categoryTotals.map(category => (
                    <div key={category.category} className="category-item">
                      <div className="category-header">
                        <span>{category.category}</span>
                        <span>{formatCurrency(category.amount)}</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${Math.min(100, (category.amount / totals.expense) * 100 || 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card span-4">
              <div className="card-header">
                <h3>{t('home.monthlyComparison')}</h3>
              </div>
              <div className="compare-body">
                <p className="compare-label">{t('home.spentLabel')}</p>
                <p className="compare-total">{formatCurrency(totals.expense)}</p>
                <div className="compare-divider" />
                <p className="compare-label">{t('home.savedLabel')}</p>
                <p className="compare-value positive">{formatCurrency(savedValue)}</p>
                <p className="compare-caption">{deltaValue}</p>
              </div>
            </div>

            <div className="card span-12">
              <div className="card-header">
                <h3>{t('home.recentTransactions')}</h3>
                <button className="link-btn" type="button" onClick={() => setActiveView('transactions')}>
                  {t('home.viewAll')}
                </button>
              </div>
              <div className="transaction-list">
                {isLoading ? (
                  <p className="empty-state">{t('home.loading')}</p>
                ) : error ? (
                  <p className="empty-state">{error}</p>
                ) : sortedTransactions.length === 0 ? (
                  <p className="empty-state">{t('home.emptyTransactions')}</p>
                ) : (
                  sortedTransactions.slice(0, 4).map(transaction => (
                    <div key={transaction.id} className="transaction-row">
                      <div className="transaction-meta">
                        <p className="transaction-title">{transaction.title}</p>
                        <p className="transaction-category">{userCategories.find(c => c.id === transaction.categoryId)?.name ?? transaction.categoryId}</p>
                      </div>
                      <p className={`transaction-amount ${transaction.type === 1 || transaction.type === 'Expense' ? 'expense' : 'income'}`}>
                        {transaction.type === 1 || transaction.type === 'Expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="view-panel fade-in" role="tabpanel">
          <div className="transactions-panel">
            <div className="card-header">
              <h3>{t('home.transactionsTitle')}</h3>
              <button className="ghost-btn" type="button" onClick={() => setActiveView('dashboard')}>
                {t('home.backToDashboard')}
              </button>
            </div>
            <div className="transactions-search">
              <input
                className="search-input"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="transaction-list">
              {isLoading ? (
                <p className="empty-state">{t('home.loading')}</p>
              ) : error ? (
                <p className="empty-state">{error}</p>
              ) : filteredTransactions.length === 0 ? (
                <p className="empty-state">{t('home.emptyTransactions')}</p>
              ) : (
                filteredTransactions.map(transaction => (
                  <div key={transaction.id} className="transaction-row">
                    <div className="transaction-meta">
                      <p className="transaction-title">{transaction.title}</p>
                      <p className="transaction-category">{userCategories.find(c => c.id === transaction.categoryId)?.name ?? transaction.categoryId}</p>
                    </div>
                    <p className={`transaction-amount ${transaction.type === 1 || transaction.type === 'Expense' ? 'expense' : 'income'}`}>
                      {transaction.type === 1 || transaction.type === 'Expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <button className="profile-link" onClick={() => setActiveScreen('profile')} type="button">
        {t('home.viewProfile')}
      </button>

      <TransactionModal
        key={modalKey}
        isOpen={isModalOpen}
        mode={modalMode}
        categories={availableCategories}
        paymentMethods={userPaymentMethods.map(method => ({ id: method.id, name: method.name }))}
        isSubmitting={isSubmitting}
        error={modalError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        t={t}
      />
    </div>
  )
}

