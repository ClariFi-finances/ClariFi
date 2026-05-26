import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { getAuthHeaders } from '@/config/api'
import { apiRequest, getErrorMessage } from '@/utils/apiClient'
import { useI18n } from '@/hooks/useI18n'
import './ReportsScreen.css'

interface ApiTransaction {
  id: number
  title: string
  amount: number
  date: string
  type: number | string
  categoryId: number
  userId: number
}

interface ApiCategory {
  id: number
  name: string
  userId: number
}

interface ApiGoal {
  id: number
  name: string
  icon: string | null
  color: string | null
  targetAmount: number
  currentAmount: number
  deadline: string | null
  userId: number
}

type FilterPeriod = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'

const PIE_COLORS = ['#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#10B981', '#3B82F6']

export function ReportsScreen() {
  const { user, token } = useAuth()
  const { t, language } = useI18n()
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('thisMonth')
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [goals, setGoals] = useState<ApiGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const headers = useMemo(() => getAuthHeaders(token, user?.cognitoId), [token, user])

  useEffect(() => {
    if (!user) return
    let isActive = true
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [transactionData, categoriesData, goalsData] = await Promise.all([
          apiRequest<ApiTransaction[]>(`/transactions?userId=${user.id}`, { headers }),
          apiRequest<ApiCategory[]>(`/categories?userId=${user.id}`, { headers }),
          apiRequest<ApiGoal[]>(`/goals?userId=${user.id}`, { headers }),
        ])
        if (isActive) {
          setTransactions(transactionData)
          setCategories(categoriesData)
          setGoals(goalsData)
        }
      } catch (err) {
        if (isActive) setError(getErrorMessage(err, t('common.error')))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    loadData()
    return () => { isActive = false }
  }, [headers, t, user])

  const userTransactions = useMemo(() => {
    if (!user) return []
    return transactions.filter(t => t.userId === user.id)
  }, [transactions, user])

  const userCategories = useMemo(() => {
    if (!user) return []
    return categories.filter(c => c.userId === user.id)
  }, [categories, user])

  const userGoals = useMemo(() => {
    if (!user) return []
    return goals.filter(g => g.userId === user.id)
  }, [goals, user])

  // Goals summary
  const goalsSummary = useMemo(() => {
    const totalSaved = userGoals.reduce((sum, g) => sum + g.currentAmount, 0)
    const totalTarget = userGoals.reduce((sum, g) => sum + g.targetAmount, 0)
    const completedCount = userGoals.filter(g => g.currentAmount >= g.targetAmount).length
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    return { totalSaved, totalTarget, completedCount, inProgress: userGoals.length - completedCount, overallProgress, total: userGoals.length }
  }, [userGoals])

  // Filtering Logic
  const now = useMemo(() => new Date(), [])
  const filteredTransactions = useMemo(() => {
    return userTransactions.filter(transaction => {
      const date = new Date(transaction.date)
      if (filterPeriod === 'thisMonth') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      if (filterPeriod === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
      }
      if (filterPeriod === 'last3Months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        return date >= threeMonthsAgo && date <= now
      }
      if (filterPeriod === 'thisYear') {
        return date.getFullYear() === now.getFullYear()
      }
      return true
    })
  }, [userTransactions, filterPeriod, now])

  // Calculations
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 0 || t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = filteredTransactions
      .filter(t => t.type === 1 || t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [filteredTransactions])

  // Bar Chart Data
  const barChartData = useMemo(() => {
    const dataMap = new Map<string, { name: string; income: number; expense: number; order: number }>()
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date)
      const monthStr = date.toLocaleString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short' })
      const key = `${date.getFullYear()}-${date.getMonth()}`
      
      const existing = dataMap.get(key) || { name: monthStr, income: 0, expense: 0, order: date.getTime() }
      if (t.type === 1 || t.type === 'Expense') existing.expense += t.amount
      else existing.income += t.amount
      dataMap.set(key, existing)
    })

    return Array.from(dataMap.values()).sort((a, b) => a.order - b.order).map(({ name, income, expense }) => ({ name, income, expense }))
  }, [filteredTransactions, language])

  // Pie Chart Data
  const pieChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 1 || t.type === 'Expense')
    const grouped = expenses.reduce<Record<string, number>>((acc, t) => {
      const catName = userCategories.find(c => c.id === t.categoryId)?.name ?? String(t.categoryId)
      acc[catName] = (acc[catName] ?? 0) + t.amount
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions, userCategories])

  const formatter = useMemo(() => {
    const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' })
  }, [language])

  const formatCurrency = (val: number) => formatter.format(val)

  return (
    <div className="reports-screen">
      <header className="reports-header">
        <h1>{t('reports.title', 'Relatorios')}</h1>
        <p className="reports-subtitle">{t('reports.subtitle', 'Analise detalhada das suas financas')}</p>
      </header>

      <div className="reports-filters">
        {(['thisMonth', 'lastMonth', 'last3Months', 'thisYear'] as FilterPeriod[]).map(period => (
          <button
            key={period}
            className={`filter-btn ${filterPeriod === period ? 'active' : ''}`}
            onClick={() => setFilterPeriod(period)}
          >
            {t(`reports.filters.${period}`, period)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : error ? (
        <p className="empty-state">{error}</p>
      ) : (
        <div className="reports-grid">
          {/* KPI Cards */}
          <div className="kpi-card">
            <div className="kpi-header">
              <ArrowUpRight size={16} className="kpi-icon income" />
              <span>{t('reports.cards.income', 'Receitas')}</span>
            </div>
            <div className="kpi-value income">{formatCurrency(totals.income)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <ArrowDownRight size={16} className="kpi-icon expense" />
              <span>{t('reports.cards.expense', 'Despesas')}</span>
            </div>
            <div className="kpi-value expense">{formatCurrency(totals.expense)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <span>{t('reports.cards.balance', 'Saldo')}</span>
            </div>
            <div className="kpi-value">{formatCurrency(totals.balance)}</div>
          </div>

          {/* Bar Chart */}
          <div className="chart-card span-7">
            <h3 className="chart-header">{t('reports.charts.incomeVsExpense', 'Receitas vs Despesas')}</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--surface-hover)' }}
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="income" name={t('reports.cards.income')} fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('reports.cards.expense')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="custom-legend">
              <div className="legend-item"><div className="legend-color" style={{ background: '#10B981' }}/>{t('reports.cards.income')}</div>
              <div className="legend-item"><div className="legend-color" style={{ background: '#EF4444' }}/>{t('reports.cards.expense')}</div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="chart-card span-5">
            <h3 className="chart-header">{t('reports.charts.expenseDistribution', 'Distribuicao de Gastos')}</h3>
            <div className="chart-wrapper">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {t('home.emptyCategories', 'Sem dados')}
                </div>
              )}
            </div>
            <div className="custom-legend">
              {pieChartData.slice(0, 4).map((entry, index) => (
                <div className="legend-item" key={entry.name}>
                  <div className="legend-color" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}/>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          {/* Category List */}
          <div className="chart-card span-8">
            <h3 className="chart-header">{t('reports.charts.expenseByCategory', 'Gastos por Categoria')}</h3>
            <div className="category-stats-list">
              {pieChartData.length > 0 ? (
                pieChartData.map((category, index) => (
                  <div className="category-stat-item" key={category.name}>
                    <div className="category-stat-header">
                      <span>{category.name}</span>
                      <div className="category-stat-value">
                        {formatCurrency(category.value)}
                        <span className="category-stat-arrow">&gt;</span>
                      </div>
                    </div>
                    <div className="category-stat-bar">
                      <div 
                        className="category-stat-fill" 
                        style={{ 
                          width: `${Math.min(100, (category.value / totals.expense) * 100)}%`,
                          background: PIE_COLORS[index % PIE_COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">{t('home.emptyCategories', 'Sem dados')}</p>
              )}
            </div>
          </div>

          {/* Compare Card */}
          <div className="chart-card span-4">
            <h3 className="chart-header">{t('reports.charts.monthlyComparison', 'Comparativo Mensal')}</h3>
            <div className="compare-content">
               <div className="compare-row">
                 <div className="compare-label"><TrendingUp size={16} color="#10B981" /> {t('reports.cards.income', 'Receitas')}</div>
                 <div className="compare-val positive">{formatCurrency(totals.income)}</div>
               </div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>+8.7% vs mes anterior</div>
               <div className="compare-row">
                 <div className="compare-label"><TrendingUp size={16} color="#EF4444" style={{ transform: 'scaleY(-1)' }}/> {t('reports.cards.expense', 'Despesas')}</div>
                 <div className="compare-val">{formatCurrency(totals.expense)}</div>
               </div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>-2.3% vs mes anterior</div>
            </div>
          </div>

          {/* Goals Overview */}
          <div className="chart-card span-12">
            <h3 className="chart-header">
              <Target size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              {t('reports.charts.goalsOverview')}
            </h3>
            {userGoals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('reports.goals.empty')}</p>
            ) : (
              <div className="goals-report-section">
                <div className="goals-report-stats">
                  <div className="goals-report-stat">
                    <span className="goals-report-stat-label">{t('reports.goals.totalSaved')}</span>
                    <span className="goals-report-stat-value accent">{formatCurrency(goalsSummary.totalSaved)}</span>
                  </div>
                  <div className="goals-report-stat">
                    <span className="goals-report-stat-label">{t('reports.goals.totalTarget')}</span>
                    <span className="goals-report-stat-value">{formatCurrency(goalsSummary.totalTarget)}</span>
                  </div>
                  <div className="goals-report-stat">
                    <span className="goals-report-stat-label">{t('reports.goals.completed')}</span>
                    <span className="goals-report-stat-value" style={{ color: '#10B981' }}>{goalsSummary.completedCount}</span>
                  </div>
                  <div className="goals-report-stat">
                    <span className="goals-report-stat-label">{t('reports.goals.inProgress')}</span>
                    <span className="goals-report-stat-value" style={{ color: '#F59E0B' }}>{goalsSummary.inProgress}</span>
                  </div>
                </div>

                <div className="goals-report-progress">
                  <div className="goals-report-progress-header">
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('reports.goals.progress')}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>{goalsSummary.overallProgress.toFixed(0)}%</span>
                  </div>
                  <div className="goals-report-progress-bar">
                    <div className="goals-report-progress-fill" style={{ width: `${Math.min(100, goalsSummary.overallProgress)}%` }} />
                  </div>
                </div>

                <div className="goals-report-list">
                  {userGoals.map(goal => {
                    const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 100
                    const done = goal.currentAmount >= goal.targetAmount
                    return (
                      <div key={goal.id} className="goals-report-item">
                        <div className="goals-report-item-top">
                          <div className="goals-report-item-icon" style={{ background: `${goal.color || '#F59E0B'}20` }}>
                            {goal.icon || '🎯'}
                          </div>
                          <div className="goals-report-item-info">
                            <span className="goals-report-item-name">{goal.name}</span>
                            <span className="goals-report-item-amounts">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <span className={`goals-report-item-badge ${done ? 'done' : ''}`}>
                            {done ? '✓' : `${progress.toFixed(0)}%`}
                          </span>
                        </div>
                        <div className="goals-report-item-bar">
                          <div
                            className="goals-report-item-fill"
                            style={{ width: `${progress}%`, background: done ? '#10B981' : (goal.color || '#F59E0B') }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
