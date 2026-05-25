'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Droplets,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  CreditCard,
  Package,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Milk,
  Wallet,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────
interface DashboardData {
  totalActiveCustomers: number
  newLeadsToday: number
  milkDeliveredToday: number
  revenueToday: number
  pendingPayments: number
  monthlySalesTrend: {
    date: string
    totalDeliveries: number
    totalMilkSold: number
    totalRevenue: number
    newCustomers: number
  }[]
  customerGrowth: { month: string; count: number }[]
  recentDeliveries: {
    id: string
    customerId: string
    date: string
    quantity: number
    status: string
    notes: string
    route: string
    customer: { name: string }
  }[]
  recentPayments: {
    id: string
    customerId: string
    amount: number
    date: string
    status: string
    method: string
    invoiceNumber: string
    period: string
    customer: { name: string }
  }[]
  todaySales: {
    id: string
    itemId: string
    quantity: number
    date: string
    notes: string
    amount: number
    item: { name: string; category: string; unit: string; pricePerUnit: number }
  }[]
  todayTotalSold: number
  todaySalesRevenue: number
}

// ── Helpers ────────────────────────────────────────────
function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString()}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

function formatChartDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

function formatMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' })
  } catch { return monthStr }
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Status configs ─────────────────────────────────────
function deliveryStatusConfig(status: string) {
  switch (status) {
    case 'Delivered': return { bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800', dot: 'bg-green-500' }
    case 'Pending': return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-500' }
    case 'Missed': return { bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800', dot: 'bg-red-500' }
    case 'Cancelled': return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', dot: 'bg-gray-400' }
    default: return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', dot: 'bg-gray-400' }
  }
}

function paymentStatusConfig(status: string) {
  switch (status) {
    case 'Completed': return { bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800', dot: 'bg-green-500' }
    case 'Pending': return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-500' }
    default: return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', dot: 'bg-gray-400' }
  }
}

function paymentMethodBadge(method: string) {
  switch (method) {
    case 'Cash': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
    case 'Bank Transfer': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
    case 'Online': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800'
    case 'UPI': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800'
    case 'Cheque': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800'
    default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
  }
}

// ── KPI Card (FinSet-style) ────────────────────────────
interface KPICardProps {
  label: string
  value: string
  subtext?: string
  icon: React.ReactNode
  iconBg: string
  trend?: { value: number; direction: 'up' | 'down' }
  accentColor: string
}

function KPICard({ label, value, subtext, icon, iconBg, trend, accentColor }: KPICardProps) {
  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-105`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trend.direction === 'up'
                ? 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
            }`}>
              {trend.direction === 'up'
                ? <ArrowUpRight className="h-3.5 w-3.5" />
                : <ArrowDownRight className="h-3.5 w-3.5" />
              }
              {trend.value}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {entry.name === 'totalRevenue' ? `₨${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">
            {entry.name === 'totalRevenue' ? 'Revenue' : entry.name === 'totalMilkSold' ? 'Liters' : entry.name === 'count' ? 'Customers' : entry.name}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Skeleton Loaders ───────────────────────────────────
function KPISkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 pl-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
      <div className="p-5 pb-0">
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="p-5 pt-3">
        <Skeleton className="h-56 md:h-72 w-full rounded-xl" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PIE CHART COLORS ───────────────────────────────────
const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

// ── Main Component ─────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Filter chart data by period
  const filteredTrend = (() => {
    const trend = data?.monthlySalesTrend ?? []
    if (chartPeriod === '7') return trend.slice(-7)
    if (chartPeriod === '30') return trend
    return trend
  })()

  // Category breakdown for pie chart
  const categoryBreakdown = (() => {
    if (!data?.todaySales) return []
    const map = new Map<string, number>()
    data.todaySales.forEach(s => {
      const cat = s.item?.category || 'Other'
      map.set(cat, (map.get(cat) || 0) + s.quantity)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
  })()

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back! Here&apos;s your dairy business overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <CalendarDays className="h-3.5 w-3.5" />
            {today}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
        ) : error ? (
          <div className="col-span-full rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-6 text-center text-sm text-red-600 dark:text-red-400">
            Failed to load KPI data. Please refresh.
          </div>
        ) : (
          <>
            <KPICard
              label="Active Customers"
              value={data?.totalActiveCustomers.toLocaleString() ?? '0'}
              subtext="Total active subscribers"
              icon={<Users className="h-5 w-5 text-green-600 dark:text-green-400" />}
              iconBg="bg-green-100 dark:bg-green-900/40"
              accentColor="bg-green-500"
              trend={{ value: 12, direction: 'up' }}
            />
            <KPICard
              label="New Leads"
              value={data?.newLeadsToday.toLocaleString() ?? '0'}
              subtext="Leads this period"
              icon={<UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-100 dark:bg-blue-900/40"
              accentColor="bg-blue-500"
              trend={{ value: 8, direction: 'up' }}
            />
            <KPICard
              label="Milk Delivered"
              value={`${data?.milkDeliveredToday.toLocaleString() ?? '0'}L`}
              subtext="Today's volume"
              icon={<Droplets className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              accentColor="bg-emerald-500"
              trend={{ value: 5, direction: 'up' }}
            />
            <KPICard
              label="Revenue Today"
              value={formatPKR(data?.revenueToday ?? 0)}
              subtext="Daily earnings"
              icon={<DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-100 dark:bg-amber-900/40"
              accentColor="bg-amber-500"
              trend={{ value: 15, direction: 'up' }}
            />
            <KPICard
              label="Pending Dues"
              value={formatPKR(data?.pendingPayments ?? 0)}
              subtext="Outstanding payments"
              icon={<AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
              iconBg="bg-red-100 dark:bg-red-900/40"
              accentColor="bg-red-500"
              trend={{ value: 3, direction: 'down' }}
            />
          </>
        )}
      </div>

      {/* ── Charts Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - 2/3 width */}
        <div className="lg:col-span-2">
          {loading ? <ChartSkeleton /> : error ? null : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Revenue Trend</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Total: {formatPKR(filteredTrend.reduce((sum, d) => sum + d.totalRevenue, 0))}
                    </p>
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    {(['7', '30', '90'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          chartPeriod === p
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {p}D
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-3 pb-5 pt-2">
                <div className="h-56 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredTrend.map(d => ({ ...d, dateLabel: formatChartDate(d.date) }))}
                      margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalRevenue"
                        name="totalRevenue"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        fill="url(#revGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown - 1/3 width */}
        <div>
          {loading ? <ChartSkeleton /> : error ? null : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-full">
              <div className="p-5 pb-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Sales by Category</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Today&apos;s product breakdown</p>
              </div>
              <div className="p-5 pt-2">
                {categoryBreakdown.length > 0 ? (
                  <>
                    <div className="h-40 md:h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryBreakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [`${value} units`, name]}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-2">
                      {categoryBreakdown.map((cat, i) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{cat.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{cat.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No sales data yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Growth Chart + Summary ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? <ChartSkeleton /> : error ? null : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Delivery Volume</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Daily milk delivery in liters</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Milk (L)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Deliveries</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-3 pb-5 pt-2">
                <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredTrend.map(d => ({ ...d, dateLabel: formatChartDate(d.date) }))}
                      margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="totalMilkSold" name="totalMilkSold" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="totalDeliveries" name="totalDeliveries" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Card */}
        <div>
          {loading ? <ListSkeleton /> : error ? null : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 h-full">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <Milk className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Sold Today</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{data?.todayTotalSold.toFixed(1)} units</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sales Revenue</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{formatPKR(data?.todaySalesRevenue ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">New Customers</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50">
                      {filteredTrend.reduce((sum, d) => sum + d.newCustomers, 0)} this period
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <Droplets className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Daily Volume</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-50">
                      {filteredTrend.length > 0
                        ? (filteredTrend.reduce((s, d) => s + d.totalMilkSold, 0) / filteredTrend.length).toFixed(1)
                        : '0'}L
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deliveries */}
        {loading ? <ListSkeleton /> : error ? null : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                    <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent Deliveries</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Latest delivery updates</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  {(data?.recentDeliveries ?? []).length} total
                </Badge>
              </div>
            </div>
            <div className="px-5 pb-5">
              {(data?.recentDeliveries ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No recent deliveries</p>
              ) : (
                <div className="space-y-1.5">
                  {(data?.recentDeliveries ?? []).slice(0, 6).map((d) => {
                    const statusCfg = deliveryStatusConfig(d.status)
                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[48px] transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 group"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold">
                            {getInitials(d.customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {d.customer.name}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d.quantity}L · {d.route} · {formatDate(d.date)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] font-medium ${statusCfg.bg}`}
                        >
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {d.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Payments */}
        {loading ? <ListSkeleton /> : error ? null : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent Payments</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Latest payment activity</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  {(data?.recentPayments ?? []).length} total
                </Badge>
              </div>
            </div>
            <div className="px-5 pb-5">
              {(data?.recentPayments ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No recent payments</p>
              ) : (
                <div className="space-y-1.5">
                  {(data?.recentPayments ?? []).slice(0, 6).map((p) => {
                    const statusCfg = paymentStatusConfig(p.status)
                    const methodStyle = paymentMethodBadge(p.method)
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[48px] transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                            {getInitials(p.customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {p.customer.name}
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-50 ml-2 shrink-0">
                              {formatPKR(p.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 ${methodStyle}`}
                            >
                              {p.method}
                            </Badge>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(p.date)}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] font-medium ${statusCfg.bg}`}
                        >
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {p.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Today's Product Sales ───────────────────────────── */}
      {!loading && !error && data?.todaySales && data.todaySales.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Today&apos;s Product Sales</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{data.todaySales.length} products sold</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800 text-[11px] font-medium px-2.5">
                  {data.todayTotalSold.toFixed(1)} units
                </Badge>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 text-[11px] font-medium px-2.5">
                  {formatPKR(data.todaySalesRevenue)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {data.todaySales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3 min-h-[52px] transition-all duration-200 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/30 dark:hover:bg-green-950/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{sale.item?.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {sale.item?.category} · ₨{sale.item?.pricePerUnit}/{sale.item?.unit}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      {sale.quantity} {sale.item?.unit}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatPKR(sale.quantity * (sale.item?.pricePerUnit ?? 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
