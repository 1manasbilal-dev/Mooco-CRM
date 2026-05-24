'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Wallet,
  Plus,
  Search,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Receipt,
  ArrowUpRight,
  Loader2,
  ChevronRight,
  Users,
  Banknote,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  phone: string
  area: string
  dailyQty: number
  monthlyBill: number
}

interface Payment {
  id: string
  customerId: string
  amount: number
  date: string
  status: string
  method: string
  invoiceNumber: string
  period: string
  notes: string
  createdAt: string
  customer: { name: string; area: string; phone: string }
}

interface PaymentSummary {
  totalDue: number
  totalReceived: number
  pendingCount: number
  customerDues: {
    customerId: string
    customerName: string
    customerPhone: string
    totalDue: number
  }[]
}

const formatPKR = (amount: number) => `₨${amount.toLocaleString()}`

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; ring: string }> = {
  Completed: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle, ring: 'ring-emerald-500/20' },
  Pending: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', icon: Clock, ring: 'ring-amber-500/20' },
  Failed: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', icon: XCircle, ring: 'ring-red-500/20' },
}

const methodConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Cash: { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/50', icon: Banknote },
  UPI: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/50', icon: ArrowUpRight },
  'Bank Transfer': { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/50', icon: Receipt },
  Cheque: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50', icon: Receipt },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state (Record Payment)
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formMethod, setFormMethod] = useState('Cash')
  const [formPeriod, setFormPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [formNotes, setFormNotes] = useState('')

  // Edit form state
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMethod, setEditMethod] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPeriod, setEditPeriod] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (methodFilter !== 'all') params.set('method', methodFilter)

      const [paymentsRes, summaryRes, customersRes] = await Promise.all([
        fetch(`/api/payments?${params.toString()}`),
        fetch('/api/payments/summary'),
        fetch('/api/customers'),
      ])

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        const filtered = searchQuery
          ? paymentsData.filter(
              (p: Payment) =>
                p.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : paymentsData
        setPayments(filtered)
      }
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, methodFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRecordPayment = async () => {
    if (!formCustomerId || !formAmount || !formDate) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      setSaving(true)
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formCustomerId,
          amount: parseFloat(formAmount),
          date: formDate,
          status: 'Completed',
          method: formMethod,
          invoiceNumber,
          period: formPeriod,
          notes: formNotes,
        }),
      })
      if (res.ok) {
        toast.success('Payment recorded successfully')
        setShowAddDialog(false)
        resetForm()
        fetchData()
      } else {
        toast.error('Failed to record payment')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Payment marked as ${newStatus}`)
        fetchData()
      }
    } catch {
      toast.error('Failed to update payment')
    }
  }

  const handleEditPayment = async () => {
    if (!selectedPayment) return
    if (!editAmount || !editDate || !editMethod) {
      toast.error('Please fill in required fields (Amount, Date, Method)')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          date: editDate,
          method: editMethod,
          status: editStatus,
          period: editPeriod,
          notes: editNotes,
        }),
      })
      if (res.ok) {
        toast.success('Payment updated successfully')
        setShowEditDialog(false)
        setSelectedPayment(null)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update payment')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePayment = async () => {
    if (!selectedPayment) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Payment deleted successfully')
        setShowDeleteDialog(false)
        setSelectedPayment(null)
        fetchData()
      } else {
        toast.error('Failed to delete payment')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment)
    setEditAmount(String(payment.amount))
    setEditDate(payment.date)
    setEditMethod(payment.method)
    setEditStatus(payment.status)
    setEditPeriod(payment.period || '')
    setEditNotes(payment.notes || '')
    setShowEditDialog(true)
  }

  const openDeleteDialog = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowDeleteDialog(true)
  }

  const resetForm = () => {
    setFormCustomerId('')
    setFormAmount('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormMethod('Cash')
    setFormPeriod(new Date().toISOString().slice(0, 7))
    setFormNotes('')
  }

  const selectedCustomer = customers.find((c) => c.id === formCustomerId)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm shadow-green-200">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Payments</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Track payments and pending dues</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-sm shadow-green-200 h-10 sm:h-10 px-3 sm:px-4"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Record Payment</span>
        </Button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 truncate">Received</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {loading ? '—' : formatPKR(summary?.totalReceived || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 shadow-sm ring-1 ring-amber-100 dark:ring-amber-900/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 truncate">Pending</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {loading ? '—' : formatPKR(summary?.totalDue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 shadow-sm ring-1 ring-red-100 dark:ring-red-900/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 truncate">Pending #</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {loading ? '—' : summary?.pendingCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/50">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 truncate">Transactions</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {loading ? '—' : payments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Customer Dues (Horizontal scroll on mobile) ─── */}
      {summary && summary.customerDues.length > 0 && (
        <Card className="rounded-xl border-0 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950 dark:via-orange-950 dark:to-amber-950 shadow-sm ring-1 ring-amber-200/60 dark:ring-amber-800/60">
          <CardHeader className="pb-2 sm:pb-3 pt-4 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Customers with Pending Dues
              <Badge className="ml-auto bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] sm:text-xs">
                {summary.customerDues.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6 px-4 sm:px-6">
            {/* Mobile: horizontal scroll | Desktop: grid */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3 sm:overflow-visible scrollbar-none">
              {summary.customerDues.slice(0, 6).map((due) => (
                <div
                  key={due.customerId}
                  className="flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 border border-amber-100 dark:border-amber-900/50 shadow-sm shrink-0 w-[220px] sm:w-auto sm:shrink transition-all hover:shadow-md"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{due.customerName}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{due.customerPhone}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg">
                    {formatPKR(due.totalDue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Filters ─── */}
      <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700 p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Search - full width on all sizes */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by customer or invoice..."
              className="pl-9 h-11 sm:h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filters row: stack on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10 rounded-xl text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10 rounded-xl text-sm">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap self-center sm:ml-auto">
              Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Payments List ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-green-100 dark:border-green-900/50 border-t-green-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base font-semibold">No payments found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Record a payment to get started</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="mt-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-11 px-5 shadow-sm shadow-green-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {payments.map((payment) => {
            const sc = statusConfig[payment.status] || statusConfig.Pending
            const mc = methodConfig[payment.method] || methodConfig.Cash
            const StatusIcon = sc.icon
            const MethodIcon = mc.icon
            return (
              <Card
                key={payment.id}
                className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 hover:shadow-md transition-all cursor-pointer"
                onClick={() => { setSelectedPayment(payment); setShowDetailDialog(true) }}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Mobile layout: stacked, compact */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Status icon */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${sc.border} ${sc.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {payment.customer?.name || 'Unknown'}
                        </p>
                        {/* Amount - prominent on mobile */}
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base whitespace-nowrap">
                          {formatPKR(payment.amount)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{payment.date}</span>
                          {/* Period & invoice hidden on mobile */}
                          {payment.period && (
                            <span className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">• {payment.period}</span>
                          )}
                          {payment.invoiceNumber && (
                            <span className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">• {payment.invoiceNumber}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {/* Method badge - hidden on mobile */}
                          <Badge variant="outline" className={`text-[10px] ${mc.color} ${mc.bg} border-0 hidden sm:inline-flex`}>
                            <MethodIcon className="h-3 w-3 mr-0.5" />
                            {payment.method}
                          </Badge>
                          {/* Status badge - always prominent */}
                          <Badge className={`${sc.bg} ${sc.color} ${sc.border} border text-[10px] sm:text-xs font-semibold ring-1 ${sc.ring}`}>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown menu - larger touch target on mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 -mr-1.5 sm:mr-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedPayment(payment); setShowDetailDialog(true) }}>
                          <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(payment) }}>
                          <Pencil className="h-4 w-4 mr-2 text-gray-500" />
                          Edit Payment
                        </DropdownMenuItem>
                        {payment.status === 'Pending' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(payment.id, 'Completed') }}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Mark Completed
                          </DropdownMenuItem>
                        )}
                        {payment.status !== 'Failed' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(payment.id, 'Failed') }}>
                            <XCircle className="h-4 w-4 mr-2 text-red-600" />
                            Mark Failed
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(payment) }}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mobile: Edit/Delete action buttons below card */}
                  <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-xs rounded-lg"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(payment) }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-xs rounded-lg text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700"
                      onClick={(e) => { e.stopPropagation(); openDeleteDialog(payment) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Record Payment Dialog (Full-screen on mobile) ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="
          sm:max-w-md sm:rounded-xl sm:top-[50%] sm:translate-y-[-50%]
          max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0
          max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none max-sm:h-full max-sm:w-full
          max-sm:rounded-none max-sm:border-0 max-sm:flex max-sm:flex-col
          max-sm:p-0 max-sm:gap-0
        ">
          <DialogHeader className="max-sm:px-4 max-sm:pt-4 max-sm:pb-2 max-sm:border-b max-sm:border-gray-100 dark:max-sm:border-gray-800 max-sm:sticky max-sm:top-0 max-sm:bg-white dark:max-sm:bg-gray-900 max-sm:z-10">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-white" />
              </div>
              Record Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 px-4 sm:px-0 overflow-y-auto flex-1 max-sm:pb-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Customer *</Label>
              <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                <SelectTrigger className="rounded-xl h-11 sm:h-10">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-3 text-sm ring-1 ring-gray-100 dark:ring-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  Monthly Bill: <span className="font-bold text-gray-900 dark:text-gray-100">{formatPKR(selectedCustomer.monthlyBill)}</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Amount (PKR) *</Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="rounded-xl h-11 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="rounded-xl h-11 sm:h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Payment Method</Label>
                <Select value={formMethod} onValueChange={setFormMethod}>
                  <SelectTrigger className="rounded-xl h-11 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Period</Label>
                <Input
                  type="month"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="rounded-xl h-11 sm:h-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes..."
                className="rounded-xl min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="max-sm:px-4 max-sm:py-3 max-sm:border-t max-sm:border-gray-100 dark:max-sm:border-gray-800 max-sm:sticky max-sm:bottom-0 max-sm:bg-white dark:max-sm:bg-gray-900 max-sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="rounded-xl h-11 sm:h-10 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={saving}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-11 sm:h-10 flex-1 sm:flex-none shadow-sm shadow-green-200"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Payment Dialog (Full-screen on mobile) ─── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="
          sm:max-w-md sm:rounded-xl sm:top-[50%] sm:translate-y-[-50%]
          max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0
          max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none max-sm:h-full max-sm:w-full
          max-sm:rounded-none max-sm:border-0 max-sm:flex max-sm:flex-col
          max-sm:p-0 max-sm:gap-0
        ">
          <DialogHeader className="max-sm:px-4 max-sm:pt-4 max-sm:pb-2 max-sm:border-b max-sm:border-gray-100 dark:max-sm:border-gray-800 max-sm:sticky max-sm:top-0 max-sm:bg-white dark:max-sm:bg-gray-900 max-sm:z-10">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-white" />
              </div>
              Edit Payment
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4 px-4 sm:px-0 overflow-y-auto flex-1 max-sm:pb-4">
              {/* Customer info (read-only) */}
              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-3 text-sm ring-1 ring-gray-100 dark:ring-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Customer: <span className="font-bold text-gray-900 dark:text-gray-100">{selectedPayment.customer?.name || 'Unknown'}</span>
                  </span>
                </div>
                {selectedPayment.invoiceNumber && (
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Invoice: {selectedPayment.invoiceNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Amount (PKR) *</Label>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0"
                    className="rounded-xl h-11 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Date *</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="rounded-xl h-11 sm:h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Payment Method *</Label>
                  <Select value={editMethod} onValueChange={setEditMethod}>
                    <SelectTrigger className="rounded-xl h-11 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="rounded-xl h-11 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Period</Label>
                <Input
                  type="month"
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(e.target.value)}
                  className="rounded-xl h-11 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="rounded-xl min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="max-sm:px-4 max-sm:py-3 max-sm:border-t max-sm:border-gray-100 dark:max-sm:border-gray-800 max-sm:sticky max-sm:bottom-0 max-sm:bg-white dark:max-sm:bg-gray-900 max-sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="rounded-xl h-11 sm:h-10 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPayment}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl h-11 sm:h-10 flex-1 sm:flex-none shadow-sm shadow-amber-200"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Payment Confirmation ─── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xl max-sm:mx-4 max-sm:max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Delete Payment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment of <strong>{selectedPayment ? formatPKR(selectedPayment.amount) : ''}</strong> for <strong>{selectedPayment?.customer?.name || 'Unknown'}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-11 sm:h-10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 sm:h-10 min-w-[100px]"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Payment Detail Dialog (Full-screen on mobile) ─── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="
          sm:max-w-md sm:rounded-xl sm:top-[50%] sm:translate-y-[-50%]
          max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0
          max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none max-sm:h-full max-sm:w-full
          max-sm:rounded-none max-sm:border-0 max-sm:flex max-sm:flex-col
          max-sm:p-0 max-sm:gap-0
        ">
          <DialogHeader className="max-sm:px-4 max-sm:pt-4 max-sm:pb-2 max-sm:border-b max-sm:border-gray-100 dark:max-sm:border-gray-800 max-sm:sticky max-sm:top-0 max-sm:bg-white dark:max-sm:bg-gray-900 max-sm:z-10">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (() => {
            const dsc = statusConfig[selectedPayment.status] || statusConfig.Pending
            const dmc = methodConfig[selectedPayment.method] || methodConfig.Cash
            const DStatusIcon = dsc.icon
            const DMethodIcon = dmc.icon
            return (
              <div className="space-y-1 overflow-y-auto flex-1 px-4 sm:px-0 py-4 max-sm:pb-4">
                {/* Status hero */}
                <div className={`rounded-xl ${dsc.bg} ring-1 ${dsc.border} p-4 mb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <DStatusIcon className={`h-5 w-5 ${dsc.color}`} />
                      <span className={`font-semibold text-sm ${dsc.color}`}>{selectedPayment.status}</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPKR(selectedPayment.amount)}</span>
                  </div>
                </div>

                {/* Detail rows */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl ring-1 ring-gray-200/60 dark:ring-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Customer</span>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="font-medium text-sm">{selectedPayment.customer?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                    <span className="text-sm font-medium">{selectedPayment.date}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Method</span>
                    <Badge variant="outline" className={`${dmc.color} ${dmc.bg} border-0 text-xs`}>
                      <DMethodIcon className="h-3 w-3 mr-1" />
                      {selectedPayment.method}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Period</span>
                    <span className="text-sm font-medium">{selectedPayment.period || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Invoice #</span>
                    <span className="text-sm font-mono bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{selectedPayment.invoiceNumber || '—'}</span>
                  </div>
                  {selectedPayment.notes && (
                    <div className="px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Notes</span>
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 rounded-xl p-3 ring-1 ring-gray-100 dark:ring-gray-700">{selectedPayment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons in detail dialog */}
                <div className="flex gap-2 pt-3 px-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailDialog(false)
                      setTimeout(() => openEditDialog(selectedPayment), 150)
                    }}
                    className="flex-1 rounded-xl h-11 sm:h-10"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {selectedPayment.status === 'Pending' && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedPayment.id, 'Completed')
                        setShowDetailDialog(false)
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-11 sm:h-10 shadow-sm shadow-green-200"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailDialog(false)
                      setTimeout(() => openDeleteDialog(selectedPayment), 150)
                    }}
                    className="rounded-xl h-11 sm:h-10 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
