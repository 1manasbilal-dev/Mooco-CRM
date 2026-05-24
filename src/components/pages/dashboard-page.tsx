'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

function formatChartDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

function formatMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' })
  } catch {
    return monthStr
  }
}

// ── Status badge colours ───────────────────────────────
function deliveryStatusConfig(status: string) {
  switch (status) {
    case 'Delivered':
      return { bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' }
    case 'Pending':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' }
    case 'Missed':
      return { bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' }
    case 'Cancelled':
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' }
    default:
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' }
  }
}

function paymentStatusConfig(status: string) {
  switch (status) {
    case 'Completed':
      return { bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' }
    case 'Pending':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' }
    default:
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' }
  }
}

function paymentMethodBadge(method: string) {
  switch (method) {
    case 'Cash':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
    case 'Bank Transfer':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
    case 'Online':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
    case 'Cheque':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
  }
}

// ── KPI Card ───────────────────────────────────────────
interface KPICardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  trend?: { value: number; direction: 'up' | 'down' }
  accentBg: string
  accentBorder: string
}

function KPICard({ label, value, icon, iconBg, trend, accentBg, accentBorder }: KPICardProps) {
  return (
    <Card
      className={`group rounded-xl border shadow-sm overflow-hidden relative transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${accentBorder} ${accentBg}`}
    >
      <CardContent className="p-3 md:p-5">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
          >
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-0.5 text-[10px] md:text-xs font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
              ) : (
                <TrendingDown className="h-3 w-3 md:h-3.5 md:w-3.5" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-2 md:mt-3">
          <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-0.5 md:mt-1 text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Custom Tooltip ─────────────────────────────────────
function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name === 'totalRevenue' ? `₨${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
          {' '}
          <span className="font-normal text-gray-400 dark:text-gray-500">
            {entry.name === 'totalRevenue'
              ? 'Revenue'
              : entry.name === 'totalMilkSold'
              ? 'Liters'
              : entry.name === 'count'
              ? 'Customers'
              : entry.name}
          </span>
        </p>
      ))}
    </div>
  )
}

// ── Skeleton Loaders ───────────────────────────────────
function KPISkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm">
      <CardContent className="p-3 md:p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2">
          <Skeleton className="h-3 w-16 md:w-20" />
          <Skeleton className="h-6 w-20 md:h-7 md:w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-0 md:pb-2 px-3 md:px-6 pt-4 md:pt-6">
        <Skeleton className="h-4 md:h-5 w-28 md:w-40" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-4 md:pb-6 pt-2">
        <Skeleton className="h-48 md:h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function ListSkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-0 md:pb-2 px-3 md:px-6 pt-4 md:pt-6">
        <Skeleton className="h-4 md:h-5 w-28 md:w-40" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between min-h-[44px]">
              <div className="space-y-1.5 md:space-y-2">
                <Skeleton className="h-3.5 md:h-4 w-20 md:w-28" />
                <Skeleton className="h-3 w-16 md:w-20" />
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Skeleton className="h-5 w-12 md:w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 shadow-sm">
            <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400">Overview of your dairy business</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-1 md:gap-1.5 border-gray-200 dark:border-gray-700 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          <CalendarDays className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="hidden sm:inline">{today}</span>
          <span className="sm:hidden">
            {new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
          </span>
        </Badge>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 md:p-6 text-center text-xs md:text-sm text-red-600 dark:text-red-400">
            Failed to load KPI data
          </div>
        ) : (
          <>
            <KPICard
              label="Active Customers"
              value={data?.totalActiveCustomers.toLocaleString() ?? '0'}
              icon={<Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />}
              iconBg="bg-green-100"
              accentBg="bg-gradient-to-br from-white to-green-50/40 dark:from-gray-900 dark:to-green-950/30"
              accentBorder="border-green-200/60 dark:border-green-800/60"
              trend={{ value: 12, direction: 'up' }}
            />
            <KPICard
              label="New Leads"
              value={data?.newLeadsToday.toLocaleString() ?? '0'}
              icon={<UserPlus className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              accentBg="bg-gradient-to-br from-white to-blue-50/40 dark:from-gray-900 dark:to-blue-950/30"
              accentBorder="border-blue-200/60 dark:border-blue-800/60"
              trend={{ value: 8, direction: 'up' }}
            />
            <KPICard
              label="Milk Delivered"
              value={`${data?.milkDeliveredToday.toLocaleString() ?? '0'}L`}
              icon={<Droplets className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />}
              iconBg="bg-emerald-100"
              accentBg="bg-gradient-to-br from-white to-emerald-50/40 dark:from-gray-900 dark:to-emerald-950/30"
              accentBorder="border-emerald-200/60 dark:border-emerald-800/60"
              trend={{ value: 5, direction: 'up' }}
            />
            <KPICard
              label="Revenue Today"
              value={formatPKR(data?.revenueToday ?? 0)}
              icon={<DollarSign className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />}
              iconBg="bg-amber-100"
              accentBg="bg-gradient-to-br from-white to-amber-50/40 dark:from-gray-900 dark:to-amber-950/30"
              accentBorder="border-amber-200/60 dark:border-amber-800/60"
              trend={{ value: 15, direction: 'up' }}
            />
            <KPICard
              label="Pending Dues"
              value={formatPKR(data?.pendingPayments ?? 0)}
              icon={<AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />}
              iconBg="bg-red-100"
              accentBg="bg-gradient-to-br from-white to-red-50/40 dark:from-gray-900 dark:to-red-950/30"
              accentBorder="border-red-200/60 dark:border-red-800/60"
              trend={{ value: 3, direction: 'down' }}
            />
          </>
        )}
      </div>

      {/* ── Charts Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 md:p-6 text-center text-xs md:text-sm text-red-600 dark:text-red-400">
            Failed to load chart data
          </div>
        ) : (
          <>
            {/* Monthly Sales Trend */}
            <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-0 px-3 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Monthly Sales Trend
                </CardTitle>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">Revenue over the last 30 days</p>
              </CardHeader>
              <CardContent className="px-2 md:px-4 pt-2 pb-3 md:pb-4">
                <div className="h-48 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(data?.monthlySalesTrend ?? []).map((d) => ({
                        ...d,
                        dateLabel: formatChartDate(d.date),
                      }))}
                      margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                        width={45}
                      />
                      <Tooltip content={<SalesTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalRevenue"
                        name="totalRevenue"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Customer Growth */}
            <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-0 px-3 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Customer Growth
                </CardTitle>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">New customers by month</p>
              </CardHeader>
              <CardContent className="px-2 md:px-4 pt-2 pb-3 md:pb-4">
                <div className="h-48 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data?.customerGrowth ?? []).map((d) => ({
                        ...d,
                        monthLabel: formatMonth(d.month),
                      }))}
                      margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={30}
                      />
                      <Tooltip content={<SalesTooltip />} />
                      <Bar
                        dataKey="count"
                        name="count"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Recent Deliveries & Payments ───────────────── */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            <ListSkeleton />
            <ListSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 md:p-6 text-center text-xs md:text-sm text-red-600 dark:text-red-400">
            Failed to load recent activity
          </div>
        ) : (
          <>
            {/* Recent Deliveries */}
            <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-4 md:pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                    <Truck className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                    Recent Deliveries
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
                {(data?.recentDeliveries ?? []).length === 0 ? (
                  <p className="py-6 md:py-8 text-center text-xs md:text-sm text-gray-400 dark:text-gray-500">
                    No recent deliveries
                  </p>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {(data?.recentDeliveries ?? []).slice(0, 5).map((d) => {
                      const statusStyle = deliveryStatusConfig(d.status)
                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 min-h-[44px] transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200">
                              {d.customer.name}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
                              {d.quantity}L · {formatDate(d.date)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`ml-2 shrink-0 text-[10px] md:text-[11px] ${statusStyle.bg}`}
                          >
                            {d.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="rounded-xl border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-4 md:pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900">
                    <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                    Recent Payments
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
                {(data?.recentPayments ?? []).length === 0 ? (
                  <p className="py-6 md:py-8 text-center text-xs md:text-sm text-gray-400 dark:text-gray-500">
                    No recent payments
                  </p>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {(data?.recentPayments ?? []).slice(0, 5).map((p) => {
                      const statusStyle = paymentStatusConfig(p.status)
                      const methodStyle = paymentMethodBadge(p.method)
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2.5 min-h-[44px] transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200">
                              {p.customer.name}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
                              {formatPKR(p.amount)} · {formatDate(p.date)}
                            </p>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-1 md:gap-1.5">
                            <Badge
                              variant="outline"
                              className={`hidden sm:inline-flex text-[10px] md:text-[11px] ${methodStyle}`}
                            >
                              {p.method}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] md:text-[11px] ${statusStyle.bg}`}
                            >
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Today's Product Sales ───────────────────────────── */}
      {!loading && !error && data?.todaySales && data.todaySales.length > 0 && (
        <Card className="rounded-xl border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50/20 dark:from-gray-900 dark:to-green-950/20 shadow-sm overflow-hidden">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-4 md:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                  <Package className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600" />
                </div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Today&apos;s Product Sales
                </CardTitle>
              </div>
              <div className="flex items-center gap-1.5 md:gap-3">
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1">
                  {data.todayTotalSold.toFixed(1)} sold
                </Badge>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1">
                  {formatPKR(data.todaySalesRevenue)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-2.5">
              {data.todaySales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 min-h-[44px] transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{sale.item?.name}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
                      {sale.item?.category} · ₨{sale.item?.pricePerUnit}/{sale.item?.unit}
                    </p>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <p className="text-xs md:text-sm font-semibold text-green-700">
                      {sale.quantity} {sale.item?.unit}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                      {formatPKR(sale.quantity * (sale.item?.pricePerUnit ?? 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
