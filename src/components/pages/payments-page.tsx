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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Completed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  Pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  Failed: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
}

const methodConfig: Record<string, { color: string; bg: string }> = {
  Cash: { color: 'text-green-700', bg: 'bg-green-50' },
  UPI: { color: 'text-blue-700', bg: 'bg-blue-50' },
  'Bank Transfer': { color: 'text-purple-700', bg: 'bg-purple-50' },
  Cheque: { color: 'text-amber-700', bg: 'bg-amber-50' },
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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formMethod, setFormMethod] = useState('Cash')
  const [formPeriod, setFormPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [formNotes, setFormNotes] = useState('')

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-sm text-gray-500">Track payments and pending dues</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Received</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? '—' : formatPKR(summary?.totalReceived || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? '—' : formatPKR(summary?.totalDue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Count</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? '—' : summary?.pendingCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? '—' : payments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Dues */}
      {summary && summary.customerDues.length > 0 && (
        <Card className="rounded-xl border-amber-200 shadow-sm bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Customers with Pending Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.customerDues.slice(0, 6).map((due) => (
                <div
                  key={due.customerId}
                  className="flex items-center justify-between rounded-lg bg-white p-3 border border-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{due.customerName}</p>
                    <p className="text-xs text-gray-500">{due.customerPhone}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    {formatPKR(due.totalDue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer or invoice..."
                className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg">
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
              <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg">
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
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Showing {payments.length} payments
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No payments found</p>
            <p className="text-gray-400 text-sm mt-1">Record a payment to get started</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const sc = statusConfig[payment.status] || statusConfig.Pending
            const mc = methodConfig[payment.method] || methodConfig.Cash
            const StatusIcon = sc.icon
            return (
              <Card key={payment.id} className="rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${sc.bg}`}>
                        <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {payment.customer?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">{payment.date}</span>
                          {payment.period && (
                            <span className="text-xs text-gray-400">• {payment.period}</span>
                          )}
                          {payment.invoiceNumber && (
                            <span className="text-xs text-gray-400">• {payment.invoiceNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-gray-900">{formatPKR(payment.amount)}</p>
                        <Badge variant="outline" className={`text-[10px] ${mc.color} ${mc.bg} border-0`}>
                          {payment.method}
                        </Badge>
                      </div>
                      <Badge className={`${sc.bg} ${sc.color} border-0 text-xs`}>
                        {payment.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowDetailDialog(true) }}>
                            View Details
                          </DropdownMenuItem>
                          {payment.status === 'Pending' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'Completed')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          {payment.status !== 'Failed' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'Failed')}>
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Mark Failed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile amount/method */}
                  <div className="flex items-center justify-between mt-2 sm:hidden">
                    <span className="font-bold text-gray-900">{formatPKR(payment.amount)}</span>
                    <Badge variant="outline" className={`text-[10px] ${mc.color} ${mc.bg} border-0`}>
                      {payment.method}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              Record Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Customer *</Label>
              <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                <SelectTrigger className="rounded-lg">
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
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="text-gray-600">
                  Monthly Bill: <span className="font-semibold">{formatPKR(selectedCustomer.monthlyBill)}</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (PKR) *</Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Method</Label>
                <Select value={formMethod} onValueChange={setFormMethod}>
                  <SelectTrigger className="rounded-lg">
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
                <Label>Period</Label>
                <Input
                  type="month"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes..."
                className="rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={`${statusConfig[selectedPayment.status]?.bg} ${statusConfig[selectedPayment.status]?.color} border-0`}>
                  {selectedPayment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="font-medium">{selectedPayment.customer?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-lg font-bold">{formatPKR(selectedPayment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span>{selectedPayment.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Method</span>
                <Badge variant="outline" className={`${methodConfig[selectedPayment.method]?.color} ${methodConfig[selectedPayment.method]?.bg} border-0`}>
                  {selectedPayment.method}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Period</span>
                <span>{selectedPayment.period || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Invoice #</span>
                <span className="text-sm font-mono">{selectedPayment.invoiceNumber || '—'}</span>
              </div>
              {selectedPayment.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notes</span>
                  <p className="mt-1 text-sm bg-gray-50 rounded-lg p-3">{selectedPayment.notes}</p>
                </div>
              )}
              {selectedPayment.status === 'Pending' && (
                <Button
                  onClick={() => {
                    handleUpdateStatus(selectedPayment.id, 'Completed')
                    setShowDetailDialog(false)
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
