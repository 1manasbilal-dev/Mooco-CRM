'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Milk,
  Truck,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string
  revenue: number
  orders: number
}

interface MilkSold {
  month: string
  fullCream: number
  toned: number
  buffalo: number
  skimmed: number
  doubleToned: number
}

interface CustomerStats {
  month: string
  newCustomers: number
  lostCustomers: number
  totalActive: number
}

interface AreaPerformance {
  area: string
  customers: number
  revenue: number
  deliveries: number
}

interface TopCustomer {
  id: string
  name: string
  monthlyBill: number
  status: string
}

interface PendingDue {
  customerId: string
  customerName: string
  pendingAmount: number
}

interface GrowthSummary {
  revenueGrowth: number
  customerGrowth: number
  milkGrowth: number
  deliveryGrowth: number
}

interface ReportData {
  monthlyRevenue: MonthlyRevenue[]
  milkSold: MilkSold[]
  customerStats: CustomerStats[]
  areaPerformance: AreaPerformance[]
  topCustomers: TopCustomer[]
  pendingDues: PendingDue[]
  growthSummary: GrowthSummary
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PKR = (val: number) => `₨${val.toLocaleString('en-PK')}`

const formatMonth = (m: string) => {
  const [y, mo] = m.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[parseInt(mo, 10) - 1] + " '" + y.slice(2)
}

const shortMonth = (m: string) => {
  const [, mo] = m.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[parseInt(mo, 10) - 1]
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? PKR(p.value)
            : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton Loaders ────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-8 w-20" />
        <Skeleton className="h-3 w-16" />
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
      <CardContent className="pt-0">
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Growth Card ─────────────────────────────────────────────────────────────

function GrowthCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  bgColor: string
}) {
  const isPositive = value >= 0
  return (
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value.toFixed(1)}%
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-gray-900' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true)
        const res = await fetch('/api/reports')
        if (!res.ok) throw new Error('Failed to fetch reports')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Reports fetch error:', err)
        setError('Failed to load reports. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="mb-1 h-7 w-28" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        {/* Growth cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <BarChart3 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Business analytics and growth insights</p>
          </div>
        </div>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <p className="text-gray-500">{error || 'No data available'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Prepare chart data ────────────────────────────────────────────────

  const revenueChartData = (data.monthlyRevenue || []).map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }))

  const milkChartData = (data.milkSold || []).map((d) => ({
    ...d,
    monthLabel: shortMonth(d.month),
    'Full Cream': d.fullCream,
    Toned: d.toned,
    Buffalo: d.buffalo,
    Skimmed: d.skimmed,
    'Double Toned': d.doubleToned,
  }))

  const customerChartData = (data.customerStats || []).map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
    New: d.newCustomers,
    Lost: Math.abs(d.lostCustomers),
  }))

  const pendingDuesData = (data.pendingDues || [])
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
    .slice(0, 8)
    .map((d) => ({
      ...d,
      name: d.customerName.length > 18 ? d.customerName.slice(0, 18) + '…' : d.customerName,
    }))

  const maxPending = pendingDuesData.length > 0 ? pendingDuesData[0].pendingAmount : 1

  const maxAreaRevenue = data.areaPerformance?.length
    ? Math.max(...data.areaPerformance.map((a) => a.revenue))
    : 1

  const maxBill = data.topCustomers?.length
    ? Math.max(...data.topCustomers.map((c) => c.monthlyBill))
    : 1

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <BarChart3 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Business analytics and growth insights</p>
        </div>
      </div>

      {/* ── Growth Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GrowthCard
          title="Revenue Growth"
          value={data.growthSummary?.revenueGrowth ?? 0}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <GrowthCard
          title="Customer Growth"
          value={data.growthSummary?.customerGrowth ?? 0}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <GrowthCard
          title="Milk Volume Growth"
          value={data.growthSummary?.milkGrowth ?? 0}
          icon={Milk}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <GrowthCard
          title="Delivery Growth"
          value={data.growthSummary?.deliveryGrowth ?? 0}
          icon={Truck}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* ── Charts Section (2×2) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Monthly Revenue Chart */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milk Sold by Type Chart */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Milk Sold by Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {milkChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={milkChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                  <Bar dataKey="Full Cream" stackId="milk" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Toned" stackId="milk" fill="#3b82f6" maxBarSize={40} />
                  <Bar dataKey="Buffalo" stackId="milk" fill="#f59e0b" maxBarSize={40} />
                  <Bar dataKey="Skimmed" stackId="milk" fill="#8b5cf6" maxBarSize={40} />
                  <Bar dataKey="Double Toned" stackId="milk" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No milk data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Growth Chart */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Customer Growth</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {customerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={customerChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="New"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#newGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Lost"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#lostGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Dues Chart */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Pending Dues</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingDuesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={pendingDuesData}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                          <p className="text-sm font-semibold text-gray-900">
                            {PKR(d.value as number)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="pendingAmount"
                    name="Pending Amount"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  >
                    {pendingDuesData.map((entry, index) => (
                      <rect
                        key={index}
                        fill={entry.pendingAmount > maxPending * 0.7 ? '#ef4444' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No pending dues
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Area Performance Section ─────────────────────────────────── */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Area Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.areaPerformance?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead className="hidden sm:table-cell w-32">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.areaPerformance.map((area) => (
                  <TableRow key={area.area}>
                    <TableCell className="font-medium text-gray-900">{area.area}</TableCell>
                    <TableCell className="text-right text-gray-600">{area.customers}</TableCell>
                    <TableCell className="text-right text-gray-600">{PKR(area.revenue)}</TableCell>
                    <TableCell className="text-right text-gray-600">{area.deliveries}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.max(3, (area.revenue / maxAreaRevenue) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              No area data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top Customers Section ────────────────────────────────────── */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Top Customers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.topCustomers?.length > 0 ? (
            <div className="space-y-3">
              {data.topCustomers.slice(0, 5).map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                >
                  {/* Rank */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700'
                      : index === 1
                        ? 'bg-gray-200 text-gray-600'
                        : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Name & Status */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{customer.name}</p>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] px-1.5 py-0 ${
                          customer.status === 'Active'
                            ? 'bg-green-50 text-green-700 hover:bg-green-50'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        {customer.status}
                      </Badge>
                    </div>
                    {/* Bill bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${Math.max(3, (customer.monthlyBill / maxBill) * 100)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-sm font-bold text-gray-900">
                        {PKR(customer.monthlyBill)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              No customer data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
