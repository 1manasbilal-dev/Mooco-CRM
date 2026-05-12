'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Milk,
  Clock,
  IndianRupee,
  Eye,
  Pencil,
  Pause,
  Play,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  TrendingUp,
  Package,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────
interface Customer {
  id: string
  name: string
  phone: string
  area: string
  address: string
  dailyQty: number
  milkType: string
  pricePerLiter: number
  status: string
  deliveryTime: string
  monthlyBill: number
  notes: string
  createdAt: string
  updatedAt: string
  _count?: { deliveries: number; payments: number }
}

interface CustomerDetail extends Customer {
  deliveries: Delivery[]
  payments: Payment[]
  lead?: { id: string; name: string } | null
}

interface Delivery {
  id: string
  date: string
  quantity: number
  status: string
  notes: string
  route: string
  createdAt: string
}

interface Payment {
  id: string
  amount: number
  date: string
  status: string
  method: string
  invoiceNumber: string
  period: string
  notes: string
  createdAt: string
}

// ── Constants ───────────────────────────────────────────────────────────
const MILK_TYPES = ['Full Cream', 'Toned', 'Double Toned', 'Skimmed', 'Buffalo']
const DELIVERY_TIMES = ['Morning', 'Evening', 'Both']
const STATUSES = ['Active', 'Paused']
const AREAS = [
  'Gulshan-e-Iqbal',
  'DHA',
  'Clifton',
  'Bahadurabad',
  'North Nazimabad',
  'Saddar',
  'PECHS',
  'Tariq Road',
  'Defence View',
  'Korangi',
]

// ── Helpers ─────────────────────────────────────────────────────────────
function formatPKR(amount: number): string {
  return '₨' + amount.toLocaleString('en-PK')
}

function calcMonthlyBill(dailyQty: number, pricePerLiter: number): number {
  return dailyQty * pricePerLiter * 30
}

// ── Component ───────────────────────────────────────────────────────────
export default function CustomersPage() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [milkFilter, setMilkFilter] = useState('All')

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Add/Edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    area: '',
    address: '',
    dailyQty: 1,
    milkType: 'Full Cream',
    pricePerLiter: 60,
    deliveryTime: 'Morning',
    notes: '',
  })

  // ── Fetch customers ──────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      if (milkFilter !== 'All') params.set('milkType', milkFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCustomers(data)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, milkFilter, search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // ── Fetch customer detail ────────────────────────────────────────────
  const fetchDetail = async (id: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedCustomer(data)
    } catch {
      toast.error('Failed to load customer details')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Form helpers ─────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      area: '',
      address: '',
      dailyQty: 1,
      milkType: 'Full Cream',
      pricePerLiter: 60,
      deliveryTime: 'Morning',
      notes: '',
    })
    setEditingCustomer(null)
  }

  const openAddForm = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      phone: customer.phone,
      area: customer.area,
      address: customer.address,
      dailyQty: customer.dailyQty,
      milkType: customer.milkType,
      pricePerLiter: customer.pricePerLiter,
      deliveryTime: customer.deliveryTime,
      notes: customer.notes,
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.area.trim()) {
      toast.error('Name, phone, and area are required')
      return
    }
    setFormLoading(true)
    try {
      const monthlyBill = calcMonthlyBill(form.dailyQty, form.pricePerLiter)
      const body = { ...form, monthlyBill, status: editingCustomer?.status || 'Active' }

      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Customer updated successfully')
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Customer added successfully')
      }
      setFormOpen(false)
      resetForm()
      fetchCustomers()
    } catch {
      toast.error(editingCustomer ? 'Failed to update customer' : 'Failed to add customer')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Status toggle ────────────────────────────────────────────────────
  const toggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'Active' ? 'Paused' : 'Active'
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        newStatus === 'Paused' ? 'Delivery paused' : 'Delivery resumed'
      )
      fetchCustomers()
      // Refresh detail if open
      if (detailOpen && selectedCustomer?.id === customer.id) {
        fetchDetail(customer.id)
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/customers/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Customer deleted')
      setDeleteOpen(false)
      setDeletingId(null)
      setDetailOpen(false)
      setSelectedCustomer(null)
      fetchCustomers()
    } catch {
      toast.error('Failed to delete customer')
    }
  }

  // ── Computed stats ───────────────────────────────────────────────────
  const activeCount = customers.filter((c) => c.status === 'Active').length
  const pausedCount = customers.filter((c) => c.status === 'Paused').length
  const totalRevenue = customers
    .filter((c) => c.status === 'Active')
    .reduce((sum, c) => sum + c.monthlyBill, 0)

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">Manage your active dairy customers</p>
          </div>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
        >
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Customers</p>
                <p className="text-xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <UserX className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Paused</p>
                <p className="text-xl font-bold text-amber-600">{pausedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Revenue</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatPKR(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, phone, area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-lg border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={milkFilter} onValueChange={setMilkFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200">
                  <SelectValue placeholder="Milk Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {MILK_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500 whitespace-nowrap">
              Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Customer Cards Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No customers found</p>
            <p className="text-sm text-gray-400">
              {search || statusFilter !== 'All' || milkFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Add your first customer to get started'}
            </p>
            {!search && statusFilter === 'All' && milkFilter === 'All' && (
              <Button
                onClick={openAddForm}
                variant="outline"
                className="mt-2 border-green-200 text-green-600 hover:bg-green-50"
              >
                <Plus className="size-4" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow py-0"
            >
              <CardContent className="p-5">
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500 truncate">
                        {customer.phone}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                      customer.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    variant="outline"
                  >
                    {customer.status}
                  </Badge>
                </div>

                {/* Area */}
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">
                    {customer.area}
                  </span>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge
                    variant="secondary"
                    className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border-0"
                  >
                    <Package className="h-3 w-3 mr-0.5" />
                    {customer.dailyQty}L/day
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border-0"
                  >
                    <Milk className="h-3 w-3 mr-0.5" />
                    {customer.milkType}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[11px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border-0"
                  >
                    <Clock className="h-3 w-3 mr-0.5" />
                    {customer.deliveryTime}
                  </Badge>
                </div>

                {/* Monthly Bill */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[11px] text-gray-400">Monthly Bill</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPKR(customer.monthlyBill)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchDetail(customer.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Customer Detail Dialog ──────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          {detailLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : selectedCustomer ? (
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 shrink-0">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg font-bold text-gray-900 truncate">
                        {selectedCustomer.name}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-500 mt-0.5">
                        Customer details and history
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-md font-medium ${
                      selectedCustomer.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    variant="outline"
                  >
                    {selectedCustomer.status}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailOpen(false)
                      openEditForm(selectedCustomer)
                    }}
                    className="h-8 text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(selectedCustomer)}
                    className={`h-8 text-xs ${
                      selectedCustomer.status === 'Active'
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {selectedCustomer.status === 'Active' ? (
                      <>
                        <Pause className="h-3 w-3" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeletingId(selectedCustomer.id)
                      setDeleteOpen(true)
                    }}
                    className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1">
                <div className="p-6 pt-4 space-y-5">
                  {/* Profile Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Profile Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">Phone</p>
                          <p className="text-sm text-gray-900">{selectedCustomer.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">Area</p>
                          <p className="text-sm text-gray-900">{selectedCustomer.area}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-gray-400">Address</p>
                          <p className="text-sm text-gray-900">
                            {selectedCustomer.address || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Milk Details */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Milk Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] text-gray-400">Daily Quantity</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedCustomer.dailyQty} L/day
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] text-gray-400">Milk Type</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedCustomer.milkType}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] text-gray-400">Price per Liter</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPKR(selectedCustomer.pricePerLiter)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-[11px] text-green-600">Monthly Bill</p>
                        <p className="text-sm font-bold text-green-700">
                          {formatPKR(selectedCustomer.monthlyBill)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Delivery Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Delivery Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">Delivery Time</p>
                          <p className="text-sm text-gray-900">
                            {selectedCustomer.deliveryTime}
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] text-gray-400">Notes</p>
                        <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* History Tabs */}
                  <Tabs defaultValue="deliveries" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="deliveries" className="flex-1">
                        <Package className="h-3.5 w-3.5 mr-1" />
                        Deliveries
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="flex-1">
                        <IndianRupee className="h-3.5 w-3.5 mr-1" />
                        Payments
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="deliveries" className="mt-3">
                      {selectedCustomer.deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Package className="h-8 w-8 mb-2" />
                          <p className="text-sm">No delivery records yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedCustomer.deliveries.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    d.status === 'Delivered'
                                      ? 'bg-green-50'
                                      : d.status === 'Missed'
                                      ? 'bg-red-50'
                                      : d.status === 'Cancelled'
                                      ? 'bg-gray-100'
                                      : 'bg-amber-50'
                                  }`}
                                >
                                  {d.status === 'Delivered' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : d.status === 'Missed' ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  ) : d.status === 'Cancelled' ? (
                                    <AlertCircle className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {d.quantity}L — {d.route}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <CalendarDays className="h-3 w-3 text-gray-400" />
                                    <p className="text-xs text-gray-500">{d.date}</p>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  d.status === 'Delivered'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : d.status === 'Missed'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : d.status === 'Cancelled'
                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {d.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="payments" className="mt-3">
                      {selectedCustomer.payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <IndianRupee className="h-8 w-8 mb-2" />
                          <p className="text-sm">No payment records yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedCustomer.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    p.status === 'Completed'
                                      ? 'bg-green-50'
                                      : p.status === 'Failed'
                                      ? 'bg-red-50'
                                      : 'bg-amber-50'
                                  }`}
                                >
                                  <IndianRupee
                                    className={`h-4 w-4 ${
                                      p.status === 'Completed'
                                        ? 'text-green-600'
                                        : p.status === 'Failed'
                                        ? 'text-red-500'
                                        : 'text-amber-500'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatPKR(p.amount)} — {p.method}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <CalendarDays className="h-3 w-3 text-gray-400" />
                                    <p className="text-xs text-gray-500">{p.date}</p>
                                    {p.period && (
                                      <span className="text-xs text-gray-400">
                                        ({p.period})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  p.status === 'Completed'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : p.status === 'Failed'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {p.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Customer Dialog ────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update customer information below'
                : 'Fill in the details to add a new customer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Phone + Area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="0300-1234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Area <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.area}
                  onValueChange={(v) => setForm({ ...form, area: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 w-full">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="address"
                placeholder="Street / house number"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Daily Qty + Milk Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dailyQty" className="text-sm font-medium">
                  Daily Quantity (L)
                </Label>
                <Input
                  id="dailyQty"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.dailyQty}
                  onChange={(e) =>
                    setForm({ ...form, dailyQty: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Milk Type</Label>
                <Select
                  value={form.milkType}
                  onValueChange={(v) => setForm({ ...form, milkType: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MILK_TYPES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price per Liter + Delivery Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pricePerLiter" className="text-sm font-medium">
                  Price per Liter (PKR)
                </Label>
                <Input
                  id="pricePerLiter"
                  type="number"
                  min="0"
                  step="5"
                  value={form.pricePerLiter}
                  onChange={(e) =>
                    setForm({ ...form, pricePerLiter: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Delivery Time</Label>
                <Select
                  value={form.deliveryTime}
                  onValueChange={(v) => setForm({ ...form, deliveryTime: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Monthly Bill Preview */}
            <div className="rounded-lg bg-green-50 p-3 flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium">
                Estimated Monthly Bill
              </span>
              <span className="text-sm font-bold text-green-700">
                {formatPKR(calcMonthlyBill(form.dailyQty, form.pricePerLiter))}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-lg border-gray-200 min-h-[72px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formLoading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              {formLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingCustomer ? (
                'Update Customer'
              ) : (
                'Add Customer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer and all their delivery and payment
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
