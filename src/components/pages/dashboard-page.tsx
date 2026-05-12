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
  PackageX,
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
  lowStockItems: {
    id: string
    name: string
    category: string
    unit: string
    currentStock: number
    minStock: number
  }[]
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
      return { bg: 'bg-green-50 text-green-700 border-green-200' }
    case 'Pending':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'Missed':
      return { bg: 'bg-red-50 text-red-700 border-red-200' }
    case 'Cancelled':
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200' }
    default:
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
}

function paymentStatusConfig(status: string) {
  switch (status) {
    case 'Completed':
      return { bg: 'bg-green-50 text-green-700 border-green-200' }
    case 'Pending':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    default:
      return { bg: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
}

function paymentMethodBadge(method: string) {
  switch (method) {
    case 'Cash':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Bank Transfer':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Online':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Cheque':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
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
}

function KPICard({ label, value, icon, iconBg, trend, accentBg }: KPICardProps) {
  return (
    <Card className={`rounded-xl border-gray-200 shadow-sm overflow-hidden relative ${accentBg}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
          >
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Custom Tooltip ─────────────────────────────────────
function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name === 'totalRevenue' ? `₨${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
          {' '}
          <span className="font-normal text-gray-400">
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
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function ListSkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
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
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <LayoutDashboard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of your dairy business</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 self-start border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 sm:self-auto"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {today}
        </Badge>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Failed to load KPI data
          </div>
        ) : (
          <>
            <KPICard
              label="Active Customers"
              value={data?.totalActiveCustomers.toLocaleString() ?? '0'}
              icon={<Users className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-100"
              accentBg="bg-gradient-to-br from-white to-green-50/40"
              trend={{ value: 12, direction: 'up' }}
            />
            <KPICard
              label="New Leads"
              value={data?.newLeadsToday.toLocaleString() ?? '0'}
              icon={<UserPlus className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              accentBg="bg-gradient-to-br from-white to-blue-50/40"
              trend={{ value: 8, direction: 'up' }}
            />
            <KPICard
              label="Milk Delivered"
              value={`${data?.milkDeliveredToday.toLocaleString() ?? '0'}L`}
              icon={<Droplets className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-100"
              accentBg="bg-gradient-to-br from-white to-emerald-50/40"
              trend={{ value: 5, direction: 'up' }}
            />
            <KPICard
              label="Revenue Today"
              value={formatPKR(data?.revenueToday ?? 0)}
              icon={<DollarSign className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-100"
              accentBg="bg-gradient-to-br from-white to-amber-50/40"
              trend={{ value: 15, direction: 'up' }}
            />
            <KPICard
              label="Pending Dues"
              value={formatPKR(data?.pendingPayments ?? 0)}
              icon={<AlertCircle className="h-5 w-5 text-red-500" />}
              iconBg="bg-red-100"
              accentBg="bg-gradient-to-br from-white to-red-50/40"
              trend={{ value: 3, direction: 'down' }}
            />
          </>
        )}
      </div>

      {/* ── Charts Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Failed to load chart data
          </div>
        ) : (
          <>
            {/* Monthly Sales Trend */}
            <Card className="rounded-xl border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Monthly Sales Trend
                </CardTitle>
                <p className="text-xs text-gray-400">Revenue over the last 30 days</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(data?.monthlySalesTrend ?? []).map((d) => ({
                        ...d,
                        dateLabel: formatChartDate(d.date),
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
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
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<SalesTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalRevenue"
                        name="totalRevenue"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Customer Growth */}
            <Card className="rounded-xl border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Customer Growth
                </CardTitle>
                <p className="text-xs text-gray-400">New customers by month</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data?.customerGrowth ?? []).map((d) => ({
                        ...d,
                        monthLabel: formatMonth(d.month),
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<SalesTooltip />} />
                      <Bar
                        dataKey="count"
                        name="count"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            <ListSkeleton />
            <ListSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Failed to load recent activity
          </div>
        ) : (
          <>
            {/* Recent Deliveries */}
            <Card className="rounded-xl border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                    <Truck className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Recent Deliveries
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {(data?.recentDeliveries ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No recent deliveries
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(data?.recentDeliveries ?? []).slice(0, 5).map((d) => {
                      const statusStyle = deliveryStatusConfig(d.status)
                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 transition-colors hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {d.customer.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {d.quantity}L · {formatDate(d.date)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`ml-2 shrink-0 text-[11px] ${statusStyle.bg}`}
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
            <Card className="rounded-xl border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
                    <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Recent Payments
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {(data?.recentPayments ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No recent payments
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(data?.recentPayments ?? []).slice(0, 5).map((p) => {
                      const statusStyle = paymentStatusConfig(p.status)
                      const methodStyle = paymentMethodBadge(p.method)
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 transition-colors hover:bg-gray-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {p.customer.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatPKR(p.amount)} · {formatDate(p.date)}
                            </p>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${methodStyle}`}
                            >
                              {p.method}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${statusStyle.bg}`}
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

      {/* ── Low Stock Alerts ───────────────────────────── */}
      {!loading && !error && data?.lowStockItems && data.lowStockItems.length > 0 && (
        <Card className="rounded-xl border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
                <PackageX className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <CardTitle className="text-base font-semibold text-amber-800">
                Low Stock Alerts
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-2">
                {data.lowStockItems.length} item{data.lowStockItems.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-2.5">
              {data.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.category} · {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {item.currentStock}{' '}
                      <span className="text-xs font-normal text-gray-400">left</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Min: {item.minStock} {item.unit}
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
