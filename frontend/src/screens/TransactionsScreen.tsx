import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Search, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { API_BASE_URL, getAuthHeaders } from '@/config/api'
import { useI18n } from '@/hooks/useI18n'
import './TransactionsScreen.css'

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

type Period = 'month' | 'quarter' | 'year' | 'all'

export function TransactionsScreen() {
  const { user, token } = useAuth()
  const { t, language } = useI18n()
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ApiPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [periodFilter, setPeriodFilter] = useState<Period>('month')

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  useEffect(() => {
    if (!user) return
    let isActive = true
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [transactionsData, categoriesData, paymentMethodsData] = await Promise.all([
          apiRequest<ApiTransaction[]>('/transactions', { headers }),
          apiRequest<ApiCategory[]>(`/categories?userId=${user.id}`, { headers }),
          apiRequest<ApiPaymentMethod[]>('/paymentmethods', { headers }),
        ])

        if (!isActive) return

        setTransactions(transactionsData)
        setCategories(categoriesData)
        setPaymentMethods(paymentMethodsData)
      } catch (err) {
        if (!isActive) return
        setError(getErrorMessage(err, t('common.loadError', 'Erro ao carregar dados')))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isActive = false
    }
  }, [headers, t, user])

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete', 'Tem certeza que deseja excluir esta transação?'))) return
    try {
      await apiRequest<void>(`/transactions/${id}`, { method: 'DELETE', headers })
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert(getErrorMessage(err, t('common.deleteError', 'Erro ao excluir transação')))
    }
  }

  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    const now = new Date()

    // Period Filter
    if (periodFilter !== 'all') {
      const limitDate = new Date()
      if (periodFilter === 'month') limitDate.setMonth(now.getMonth() - 1)
      else if (periodFilter === 'quarter') limitDate.setMonth(now.getMonth() - 3)
      else if (periodFilter === 'year') limitDate.setFullYear(now.getFullYear() - 1)
      result = result.filter(t => new Date(t.date) >= limitDate)
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(t => {
        const isExpense = t.type === 1 || t.type === 'Expense'
        return typeFilter === 'expense' ? isExpense : !isExpense
      })
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.categoryId === categoryFilter)
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, periodFilter, typeFilter, categoryFilter, searchQuery])

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const isExpense = t.type === 1 || t.type === 'Expense'
      if (isExpense) acc.expense += t.amount
      else acc.income += t.amount
      return acc
    }, { income: 0, expense: 0 })
  }, [filteredTransactions])

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(language === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency', currency: 'BRL'
    })
  }, [language])

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, ApiTransaction[]> = {}
    filteredTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' })
      if (!groups[date]) groups[date] = []
      groups[date].push(t)
    })
    return Object.entries(groups)
  }, [filteredTransactions, language])

  return (
    <div className="transactions-screen">
      <header className="screen-header">
        <div>
          <h1>{t('sidebar.nav.transactions', 'Transações')}</h1>
          <p className="subtitle">{filteredTransactions.length} {t('transactions.found', 'transações encontradas')}</p>
        </div>
        <div className="summary-cards">
          <div className="summary-card income">
            <span>{t('home.revenue', 'Receita')}</span>
            <h3>{currencyFormatter.format(totals.income)}</h3>
          </div>
          <div className="summary-card expense">
            <span>{t('home.expenses', 'Despesas')}</span>
            <h3>{currencyFormatter.format(totals.expense)}</h3>
          </div>
          <div className="summary-card balance">
            <span>{t('home.balance', 'Saldo')}</span>
            <h3>{currencyFormatter.format(totals.income - totals.expense)}</h3>
          </div>
        </div>
      </header>

      <section className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('home.searchPlaceholder', 'Buscar transações...')} 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filters-group">
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value as Period)}>
            <option value="month">{t('transactions.periodMonth', 'Último Mês')}</option>
            <option value="quarter">{t('transactions.periodQuarter', 'Últimos 3 Meses')}</option>
            <option value="year">{t('transactions.periodYear', 'Último Ano')}</option>
            <option value="all">{t('transactions.periodAll', 'Tudo')}</option>
          </select>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
            <option value="all">{t('transactions.allTypes', 'Todos Tipos')}</option>
            <option value="income">{t('home.income', 'Receita')}</option>
            <option value="expense">{t('home.expense', 'Despesa')}</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">{t('transactions.allCategories', 'Todas Categorias')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </section>

      <main className="transactions-content">
        {isLoading ? (
          <div className="empty-state">{t('home.loading', 'Carregando...')}</div>
        ) : groupedTransactions.length === 0 ? (
          <div className="empty-state">{t('home.emptyTransactions', 'Nenhuma transação encontrada.')}</div>
        ) : (
          <div className="transactions-list">
            {groupedTransactions.map(([date, items]) => (
              <div key={date} className="date-group">
                <h4 className="date-title">{date}</h4>
                {items.map(item => {
                  const isExpense = item.type === 1 || item.type === 'Expense'
                  const category = categories.find(c => c.id === item.categoryId)
                  const pm = paymentMethods.find(p => p.id === item.paymentMethodId)
                  
                  return (
                    <div key={item.id} className="transaction-card">
                      <div className="card-left">
                        <div 
                          className="category-icon" 
                          style={{ backgroundColor: category?.color || 'var(--border)' }}
                        >
                          {isExpense ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                        </div>
                        <div className="info">
                          <p className="title">{item.title}</p>
                          <p className="meta">
                            <span className="category-name">{category?.name || 'Sem Categoria'}</span>
                            <span className="divider">•</span>
                            <span className="pm-name">{pm?.name || 'Dinheiro'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="card-right">
                        <p className={`amount ${isExpense ? 'expense' : 'income'}`}>
                          {isExpense ? '-' : '+'} {currencyFormatter.format(item.amount)}
                        </p>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
