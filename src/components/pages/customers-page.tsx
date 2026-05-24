'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
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
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  X,
  CheckSquare,
  CreditCard,
  BarChart3,
  Wallet,
  Activity,
  ChevronRight,
  Umbrella,
  ShoppingBag,
  PencilLine,
  ShoppingCart,
  CalendarOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

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

interface Vacation {
  id: string
  customerId: string
  startDate: string
  endDate: string
  notes: string
  createdAt: string
  updatedAt: string
}

interface CustomerProductItem {
  id: string
  name: string
  category: string
  unit: string
  pricePerUnit: number
  status: string
}

interface CustomerProduct {
  id: string
  customerId: string
  itemId: string
  dailyQty: number
  createdAt: string
  updatedAt: string
  item: CustomerProductItem
}

interface SaleItem {
  name: string
  category: string
  unit: string
  pricePerUnit: number
}

interface Sale {
  id: string
  itemId: string
  customerId: string | null
  quantity: number
  date: string
  notes: string
  amount: number
  createdAt: string
  updatedAt: string
  item: SaleItem
}

interface Delivery {
  id: string
  date: string
  quantity: number
  status: string
  notes: string
  route: string
  itemId: string | null
  isExtra: boolean
  pricePerUnit: number
  productName: string
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

interface CustomerDetail extends Customer {
  deliveries: Delivery[]
  payments: Payment[]
  lead?: { id: string; name: string } | null
  products: CustomerProduct[]
  vacations: Vacation[]
  sales: Sale[]
}

interface LedgerEntry {
  id: string
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  type: 'delivery' | 'payment' | 'sale'
  status: string
}

// ── Constants ───────────────────────────────────────────────────────────
const STATUSES = ['Active', 'Paused']

const CATEGORY_COLORS: Record<string, string> = {
  Milk: 'bg-blue-400',
  Yogurt: 'bg-purple-400',
  Butter: 'bg-yellow-400',
  Cream: 'bg-amber-300',
  Eggs: 'bg-orange-400',
  Paneer: 'bg-green-400',
  Other: 'bg-gray-400',
}

// ── Helpers ─────────────────────────────────────────────────────────────
function formatPKR(amount: number): string {
  return '₨' + amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function calcMonthlyBill(dailyQty: number, pricePerLiter: number): number {
  return dailyQty * pricePerLiter * 30
}

function isVacationActive(vacation: Vacation): boolean {
  const today = new Date().toISOString().split('T')[0]
  return vacation.startDate <= today && vacation.endDate >= today
}

function isVacationUpcoming(vacation: Vacation): boolean {
  const today = new Date().toISOString().split('T')[0]
  return vacation.startDate > today
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-PK', opts)} — ${e.toLocaleDateString('en-PK', opts)}`
}

function buildLedger(customer: CustomerDetail): LedgerEntry[] {
  const entries: LedgerEntry[] = []

  // Add delivery entries as debits — use productName and pricePerUnit from delivery
  for (const d of customer.deliveries) {
    if (d.status === 'Delivered') {
      const price = d.pricePerUnit || customer.pricePerLiter
      const name = d.productName || 'Milk'
      entries.push({
        id: `d-${d.id}`,
        date: d.date,
        description: `${name} Delivery — ${d.quantity}${d.itemId ? '' : 'L'} × ${formatPKR(price)}${d.itemId ? `/${d.itemId ? 'unit' : 'L'}` : '/L'}`,
        debit: d.quantity * price,
        credit: 0,
        balance: 0,
        type: 'delivery',
        status: d.status,
      })
    }
  }

  // Add sale entries as debits (extra sales linked to customer)
  for (const s of customer.sales) {
    const pricePerUnit = s.item.pricePerUnit || 0
    entries.push({
      id: `s-${s.id}`,
      date: s.date,
      description: `${s.item.name} Sale — ${s.quantity} × ${formatPKR(pricePerUnit)}`,
      debit: s.amount || (s.quantity * pricePerUnit),
      credit: 0,
      balance: 0,
      type: 'sale',
      status: 'Completed',
    })
  }

  // Add payment entries as credits (amounts paid)
  for (const p of customer.payments) {
    if (p.status === 'Completed') {
      entries.push({
        id: `p-${p.id}`,
        date: p.date,
        description: `Payment — ${p.method}${p.period ? ` (${p.period})` : ''}`,
        debit: 0,
        credit: p.amount,
        balance: 0,
        type: 'payment',
        status: p.status,
      })
    }
  }

  // Sort by date, then by type (payments first on same date)
  entries.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.type === 'payment' ? -1 : 1
  })

  // Calculate running balance (positive = owed to business)
  let balance = 0
  for (const entry of entries) {
    balance += entry.debit - entry.credit
    entry.balance = balance
  }

  return entries
}

// ── Component ───────────────────────────────────────────────────────────
export default function CustomersPage() {
  const isMobile = useIsMobile()

  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [milkFilter, setMilkFilter] = useState('All')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')

  // Add/Edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Vacation form
  const [vacationFormOpen, setVacationFormOpen] = useState(false)
  const [vacationForm, setVacationForm] = useState({ startDate: '', endDate: '', notes: '' })
  const [vacationLoading, setVacationLoading] = useState(false)

  // Product form
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productForm, setProductForm] = useState({ itemId: '', dailyQty: 1 })
  const [productLoading, setProductLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CustomerProduct | null>(null)
  const [editProductQty, setEditProductQty] = useState('')
  const [editProductOpen, setEditProductOpen] = useState(false)

  // Inventory items for product dropdown
  const [inventoryItems, setInventoryItems] = useState<CustomerProductItem[]>([])

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

  // Dynamic options from API
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [milkTypes, setMilkTypes] = useState<{ id: string; name: string; pricePerLiter: number }[]>([])
  const [deliveryTimes, setDeliveryTimes] = useState<{ id: string; name: string }[]>([])

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

  // Fetch dynamic options
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [areasRes, milkTypesRes, deliveryTimesRes, inventoryRes] = await Promise.all([
          fetch('/api/areas'),
          fetch('/api/milk-types'),
          fetch('/api/delivery-times'),
          fetch('/api/inventory'),
        ])
        if (areasRes.ok) {
          const data = await areasRes.json()
          setAreas(Array.isArray(data) ? data : [])
        }
        if (milkTypesRes.ok) {
          const data = await milkTypesRes.json()
          setMilkTypes(Array.isArray(data) ? data : [])
        }
        if (deliveryTimesRes.ok) {
          const data = await deliveryTimesRes.json()
          setDeliveryTimes(Array.isArray(data) ? data : [])
        }
        if (inventoryRes.ok) {
          const data = await inventoryRes.json()
          setInventoryItems(Array.isArray(data) ? data : [])
        }
      } catch { /* ignore */ }
    }
    fetchOptions()
  }, [])

  // ── Fetch customer detail ────────────────────────────────────────────
  const fetchDetail = async (id: string, tab?: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    setDetailTab(tab || 'overview')
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
      toast.success(newStatus === 'Paused' ? 'Delivery paused' : 'Delivery resumed')
      fetchCustomers()
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

  // ── Bulk actions ─────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkAction = async (action: 'Active' | 'Paused' | 'delete') => {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()

      if (action === 'delete') {
        toast.success(`${result.count} customer(s) deleted`)
      } else {
        toast.success(`${result.count} customer(s) set to ${action}`)
      }
      clearSelection()
      fetchCustomers()
    } catch {
      toast.error('Failed to perform bulk action')
    } finally {
      setBulkLoading(false)
    }
  }

  // ── Vacation handlers ────────────────────────────────────────────────
  const handleAddVacation = async () => {
    if (!selectedCustomer || !vacationForm.startDate || !vacationForm.endDate) {
      toast.error('Start date and end date are required')
      return
    }
    if (vacationForm.endDate < vacationForm.startDate) {
      toast.error('End date must be after start date')
      return
    }
    setVacationLoading(true)
    try {
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          startDate: vacationForm.startDate,
          endDate: vacationForm.endDate,
          notes: vacationForm.notes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add vacation')
      }
      toast.success('Vacation added')
      setVacationFormOpen(false)
      setVacationForm({ startDate: '', endDate: '', notes: '' })
      fetchDetail(selectedCustomer.id, 'vacations')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add vacation')
    } finally {
      setVacationLoading(false)
    }
  }

  const handleDeleteVacation = async (vacationId: string) => {
    if (!selectedCustomer) return
    try {
      const res = await fetch(`/api/vacations/${vacationId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Vacation removed')
      fetchDetail(selectedCustomer.id, 'vacations')
    } catch {
      toast.error('Failed to remove vacation')
    }
  }

  // ── Customer Product handlers ────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!selectedCustomer || !productForm.itemId) {
      toast.error('Please select a product')
      return
    }
    setProductLoading(true)
    try {
      const res = await fetch('/api/customer-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          itemId: productForm.itemId,
          dailyQty: productForm.dailyQty,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add product')
      }
      toast.success('Product added to daily plan')
      setProductFormOpen(false)
      setProductForm({ itemId: '', dailyQty: 1 })
      fetchDetail(selectedCustomer.id, 'products')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setProductLoading(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedCustomer || !editingProduct) return
    const qty = parseFloat(editProductQty)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    try {
      const res = await fetch(`/api/customer-products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyQty: qty }),
      })
      if (!res.ok) throw new Error()
      toast.success('Product quantity updated')
      setEditProductOpen(false)
      setEditingProduct(null)
      fetchDetail(selectedCustomer.id, 'products')
    } catch {
      toast.error('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedCustomer) return
    try {
      const res = await fetch(`/api/customer-products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Product removed from daily plan')
      fetchDetail(selectedCustomer.id, 'products')
    } catch {
      toast.error('Failed to remove product')
    }
  }

  // ── Computed stats ───────────────────────────────────────────────────
  const activeCount = customers.filter((c) => c.status === 'Active').length
  const pausedCount = customers.filter((c) => c.status === 'Paused').length
  const totalRevenue = customers
    .filter((c) => c.status === 'Active')
    .reduce((sum, c) => sum + c.monthlyBill, 0)

  const allSelected = customers.length > 0 && selectedIds.size === customers.length

  // Ledger computed values
  const ledger = useMemo(() => {
    if (!selectedCustomer) return []
    return buildLedger(selectedCustomer)
  }, [selectedCustomer])

  const ledgerSummary = useMemo(() => {
    const totalDebit = ledger.reduce((sum, e) => sum + e.debit, 0)
    const totalCredit = ledger.reduce((sum, e) => sum + e.credit, 0)
    return { totalDebit, totalCredit, balance: totalDebit - totalCredit }
  }, [ledger])

  // Current month stats for overview tab
  const currentMonthStats = useMemo(() => {
    if (!selectedCustomer) return { deliveries: 0, deliveredLiters: 0, paymentsCount: 0, paymentsTotal: 0 }
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const monthDeliveries = selectedCustomer.deliveries.filter(
      (d) => d.date.startsWith(monthStr) && d.status === 'Delivered'
    )
    const monthPayments = selectedCustomer.payments.filter(
      (p) => p.date.startsWith(monthStr) && p.status === 'Completed'
    )

    return {
      deliveries: monthDeliveries.length,
      deliveredLiters: monthDeliveries.reduce((s, d) => s + d.quantity, 0),
      paymentsCount: monthPayments.length,
      paymentsTotal: monthPayments.reduce((s, p) => s + p.amount, 0),
    }
  }, [selectedCustomer])

  // Available products for adding (exclude already-added ones)
  const availableProducts = useMemo(() => {
    if (!selectedCustomer) return []
    const addedIds = new Set(selectedCustomer.products.map((p) => p.itemId))
    return inventoryItems.filter((item) => item.status === 'Active' && !addedIds.has(item.id))
  }, [selectedCustomer, inventoryItems])

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-20">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm shadow-green-200 dark:shadow-green-900/30">
            <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xs:block">Manage your active dairy customers</p>
          </div>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shadow-green-200 dark:shadow-green-900/30 h-10 sm:h-auto"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline ml-1">Add Customer</span>
        </Button>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Paused</p>
                <p className="text-lg sm:text-xl font-bold text-amber-600">{pausedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Revenue/mo</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600">
                  {formatPKR(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">All</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {customers.length} result{customers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search name, phone, area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 rounded-lg border-gray-200 dark:border-gray-700 w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 w-full">
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
                <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 w-full">
                  <SelectValue placeholder="Milk Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {milkTypes.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-row sm:items-center sm:flex-1 gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Select All</span>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search name, phone, area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-lg border-gray-200 dark:border-gray-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg border-gray-200 dark:border-gray-700">
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
                <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Milk Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {milkTypes.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Customer List / Cards ──────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm">
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Users className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No customers found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {search || statusFilter !== 'All' || milkFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Add your first customer to get started'}
            </p>
            {!search && statusFilter === 'All' && milkFilter === 'All' && (
              <Button
                onClick={openAddForm}
                variant="outline"
                className="mt-2 border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50 min-h-[44px]"
              >
                <Plus className="size-4" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Mobile: Compact List ──────────────────────────────── */}
          <div className="flex flex-col gap-1 sm:hidden">
            {customers.map((customer) => {
              const isSelected = selectedIds.has(customer.id)
              return (
                <div
                  key={customer.id}
                  onClick={() => fetchDetail(customer.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all active:scale-[0.99] min-h-[44px] ${
                    isSelected
                      ? 'border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-950/60 ring-1 ring-green-500/30'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(customer.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{customer.name}</span>
                      <Badge
                        className={`shrink-0 text-[10px] px-1.5 py-0 rounded-md font-semibold ${
                          customer.status === 'Active'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}
                        variant="outline"
                      >
                        {customer.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <Phone className="h-2.5 w-2.5" />
                        {customer.phone}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {customer.area}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatPKR(customer.monthlyBill)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{customer.dailyQty}L/day</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </div>
              )
            })}
          </div>

          {/* ── Desktop: Card Grid ───────────────────────────────── */}
          <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
              const isSelected = selectedIds.has(customer.id)
              return (
                <Card
                  key={customer.id}
                  className={`rounded-xl border-gray-200/80 dark:border-gray-700 shadow-sm hover:shadow-md transition-all py-0 relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-green-500/40 border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/30' : ''
                  }`}
                >
                  <div className={`h-0.5 ${isSelected ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2 mb-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {customer.name}
                          </h3>
                          <Badge
                            className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              customer.status === 'Active'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            }`}
                            variant="outline"
                          >
                            {customer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {customer.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 pl-7">
                      <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {customer.area}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3 pl-7">
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border-0 dark:bg-blue-950 dark:text-blue-300"
                      >
                        <Package className="h-3 w-3 mr-0.5" />
                        {customer.dailyQty}L/day
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border-0 dark:bg-purple-950 dark:text-purple-300"
                      >
                        <Milk className="h-3 w-3 mr-0.5" />
                        {customer.milkType}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border-0 dark:bg-orange-950 dark:text-orange-300"
                      >
                        <Clock className="h-3 w-3 mr-0.5" />
                        {customer.deliveryTime}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 pl-7">
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">Monthly Bill</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatPKR(customer.monthlyBill)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchDetail(customer.id)}
                          className="text-green-600 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 min-h-[44px] min-w-[44px]"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchDetail(customer.id, 'ledger')}
                          className="text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 min-h-[44px] min-w-[44px]"
                        >
                          <BookOpen className="h-3.5 w-3.5 mr-1" />
                          Ledger
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* ── Bulk Action Bar ─────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="mx-auto max-w-5xl px-3 sm:px-4 pb-2 sm:pb-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500">
                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {selectedIds.size} selected
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Choose an action</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex sm:hidden items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('Active')}
                        disabled={bulkLoading}
                        className="h-10 w-10 p-0 border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Set Active</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('Paused')}
                        disabled={bulkLoading}
                        className="h-10 w-10 p-0 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Set Paused</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                        disabled={bulkLoading}
                        className="h-10 w-10 p-0 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        {bulkLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="h-10 w-10 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Clear</TooltipContent>
                  </Tooltip>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('Active')}
                    disabled={bulkLoading}
                    className="h-8 text-xs border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
                  >
                    <UserCheck className="h-3 w-3" />
                    Set Active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('Paused')}
                    disabled={bulkLoading}
                    className="h-8 text-xs border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <Pause className="h-3 w-3" />
                    Set Paused
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={bulkLoading}
                    className="h-8 text-xs border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    {bulkLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-8 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Detail Dialog ──────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl w-[100vw] h-[100dvh] sm:h-auto sm:max-h-[92vh] p-0 overflow-hidden sm:rounded-lg rounded-none">
          {detailLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : selectedCustomer ? (
            <div className="flex flex-col h-full sm:max-h-[92vh]">
              {/* Header */}
              <div className="p-4 sm:p-6 sm:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shrink-0">
                      <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                        {selectedCustomer.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Customer details and transaction history
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-md font-medium ${
                      selectedCustomer.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    }`}
                    variant="outline"
                  >
                    {selectedCustomer.status}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailOpen(false)
                      openEditForm(selectedCustomer)
                    }}
                    className="min-h-[44px] text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(selectedCustomer)}
                    className={`min-h-[44px] text-xs ${
                      selectedCustomer.status === 'Active'
                        ? 'border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                        : 'border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50'
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
                    className="min-h-[44px] text-xs border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Scrollable Content with Tabs */}
              <ScrollArea className="flex-1">
                <div className="p-4 sm:p-6 sm:pt-4">
                  <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                    {/* ── Scrollable Tabs ──────────────────────────── */}
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                      <TabsList className="w-full grid grid-cols-4 h-11 min-w-[400px]">
                        <TabsTrigger value="overview" className="text-[11px] sm:text-xs">
                          <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Overview</span>
                          <span className="sm:hidden">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="products" className="text-[11px] sm:text-xs">
                          <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Products</span>
                          <span className="sm:hidden">Products</span>
                        </TabsTrigger>
                        <TabsTrigger value="vacations" className="text-[11px] sm:text-xs">
                          <Umbrella className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Vacations</span>
                          <span className="sm:hidden">Leave</span>
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="text-[11px] sm:text-xs">
                          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          Ledger
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* ── Overview Tab ─────────────────────────────── */}
                    <TabsContent value="overview" className="mt-3 sm:mt-4 space-y-4 sm:space-y-5">
                      {/* Profile Info */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          Profile Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">Phone</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedCustomer.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">Area</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedCustomer.area}</p>
                            </div>
                          </div>
                          <div className="col-span-2 flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">Address</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {selectedCustomer.address || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Milk Details */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          Milk Plan
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Daily Quantity</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {selectedCustomer.dailyQty} L/day
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Milk Type</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {selectedCustomer.milkType}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Price per Liter</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatPKR(selectedCustomer.pricePerLiter)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-3 border border-green-100 dark:border-green-900">
                            <p className="text-[11px] text-green-600">Monthly Bill</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-300">
                              {formatPKR(selectedCustomer.monthlyBill)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Active Vacation Banner */}
                      {selectedCustomer.vacations.some((v) => isVacationActive(v)) && (
                        <>
                          <Separator />
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-3 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                              <Umbrella className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Currently on Vacation</p>
                              <p className="text-[11px] text-amber-600 truncate">
                                {selectedCustomer.vacations
                                  .filter((v) => isVacationActive(v))
                                  .map((v) => formatDateRange(v.startDate, v.endDate))
                                  .join(', ')}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Current Month Summary */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          Current Month Summary
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-green-100 dark:border-green-900 bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-950/80 dark:to-emerald-950/50 p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-green-600" />
                              <p className="text-xs font-medium text-green-700 dark:text-green-300">Deliveries</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">
                              {currentMonthStats.deliveries}
                            </p>
                            <p className="text-[11px] sm:text-xs text-green-600 mt-0.5">
                              {currentMonthStats.deliveredLiters.toFixed(1)}L delivered
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/80 dark:to-teal-950/50 p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Payments</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                              {currentMonthStats.paymentsCount}
                            </p>
                            <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5">
                              {formatPKR(currentMonthStats.paymentsTotal)} received
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Quick Stats */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          Quick Stats
                        </h4>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5 sm:p-3 text-center">
                            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                              {selectedCustomer.deliveries.filter((d) => d.status === 'Delivered').length}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">Total Deliveries</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5 sm:p-3 text-center">
                            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                              {selectedCustomer.payments.filter((p) => p.status === 'Completed').length}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">Total Payments</p>
                          </div>
                          <div className={`rounded-lg p-2.5 sm:p-3 text-center ${
                            ledgerSummary.balance > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950' : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'
                          }`}>
                            <IndianRupee className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto mb-1 ${
                              ledgerSummary.balance > 0 ? 'text-red-400' : 'text-green-400'
                            }`} />
                            <p className={`text-base sm:text-lg font-bold ${
                              ledgerSummary.balance > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                            }`}>
                              {formatPKR(Math.abs(ledgerSummary.balance))}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">
                              {ledgerSummary.balance > 0 ? 'Outstanding' : ledgerSummary.balance < 0 ? 'Overpaid' : 'Settled'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedCustomer.notes && (
                        <>
                          <Separator />
                          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Notes</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCustomer.notes}</p>
                          </div>
                        </>
                      )}
                    </TabsContent>

                    {/* ── Products Tab ────────────────────────────── */}
                    <TabsContent value="products" className="mt-3 sm:mt-4 space-y-4">
                      {/* Milk Plan - Primary Product */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                          Primary Milk Plan
                        </h4>
                        <div className="rounded-xl border border-green-100 dark:border-green-900 bg-gradient-to-br from-green-50/60 to-emerald-50/40 dark:from-green-950/60 dark:to-emerald-950/40 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 shrink-0">
                              <Milk className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedCustomer.milkType} Milk</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Daily delivery</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 p-2.5">
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">Daily Qty</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedCustomer.dailyQty} L</p>
                            </div>
                            <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 p-2.5">
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">Price/L</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPKR(selectedCustomer.pricePerLiter)}</p>
                            </div>
                            <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 p-2.5">
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">Monthly</p>
                              <p className="text-sm font-bold text-green-700 dark:text-green-300 dark:text-green-300">{formatPKR(selectedCustomer.monthlyBill)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Other Daily Products */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Other Daily Products
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProductForm({ itemId: '', dailyQty: 1 })
                              setProductFormOpen(true)
                            }}
                            className="h-8 text-[11px] border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
                            disabled={availableProducts.length === 0}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Product
                          </Button>
                        </div>

                        {selectedCustomer.products.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                            <ShoppingBag className="h-8 w-8 mb-2" />
                            <p className="text-sm font-medium">No additional products</p>
                            <p className="text-xs mt-1">Add other daily products this customer receives</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedCustomer.products.map((cp) => (
                              <div
                                key={cp.id}
                                className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3 min-h-[52px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[cp.item.category] || 'bg-gray-400'}`} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{cp.item.name}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                      {cp.item.category} · {formatPKR(cp.item.pricePerUnit)}/{cp.item.unit}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cp.dailyQty} {cp.item.unit}</p>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatPKR(cp.dailyQty * cp.item.pricePerUnit)}/day</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProduct(cp)
                                      setEditProductQty(String(cp.dailyQty))
                                      setEditProductOpen(true)
                                    }}
                                    className="h-8 w-8 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <PencilLine className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(cp.id)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── Vacations Tab ───────────────────────────── */}
                    <TabsContent value="vacations" className="mt-3 sm:mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Vacations & Leave
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVacationForm({ startDate: '', endDate: '', notes: '' })
                            setVacationFormOpen(true)
                          }}
                          className="h-8 text-[11px] border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Vacation
                        </Button>
                      </div>

                      {selectedCustomer.vacations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                          <Umbrella className="h-10 w-10 mb-3" />
                          <p className="text-sm font-medium">No vacations scheduled</p>
                          <p className="text-xs mt-1">Add vacation periods when the customer won&apos;t receive deliveries</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedCustomer.vacations.map((v) => {
                            const active = isVacationActive(v)
                            const upcoming = isVacationUpcoming(v)
                            return (
                              <div
                                key={v.id}
                                className={`rounded-xl border p-3 min-h-[52px] transition-colors ${
                                  active
                                    ? 'border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-50'
                                    : upcoming
                                    ? 'border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/40'
                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                                    active ? 'bg-amber-100' : upcoming ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-800'
                                  }`}>
                                    {active ? (
                                      <Umbrella className="h-4 w-4 text-amber-600" />
                                    ) : upcoming ? (
                                      <CalendarOff className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {formatDateRange(v.startDate, v.endDate)}
                                      </p>
                                      {active && (
                                        <Badge className="shrink-0 text-[9px] px-1.5 py-0 rounded-md bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800" variant="outline">
                                          Active
                                        </Badge>
                                      )}
                                      {upcoming && (
                                        <Badge className="shrink-0 text-[9px] px-1.5 py-0 rounded-md bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800" variant="outline">
                                          Upcoming
                                        </Badge>
                                      )}
                                    </div>
                                    {v.notes && (
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{v.notes}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteVacation(v.id)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Info note */}
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Customers on vacation won&apos;t be included in daily delivery auto-generation.
                          Past vacations are kept for records.
                        </p>
                      </div>
                    </TabsContent>

                    {/* ── Ledger Tab ───────────────────────────────── */}
                    <TabsContent value="ledger" className="mt-3 sm:mt-4">
                      {ledger.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                          <BookOpen className="h-10 w-10 mb-3" />
                          <p className="text-sm font-medium">No ledger entries yet</p>
                          <p className="text-xs mt-1">Transactions will appear here as deliveries and payments are recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Ledger Summary Cards */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-50 p-2.5 sm:p-3 text-center">
                              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mx-auto mb-1" />
                              <p className="text-[10px] sm:text-xs text-red-600">Debit</p>
                              <p className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300">
                                {formatPKR(ledgerSummary.totalDebit)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-2.5 sm:p-3 text-center">
                              <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mx-auto mb-1" />
                              <p className="text-[10px] sm:text-xs text-green-600">Credit</p>
                              <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-300">
                                {formatPKR(ledgerSummary.totalCredit)}
                              </p>
                            </div>
                            <div className={`rounded-lg p-2.5 sm:p-3 text-center ${
                              ledgerSummary.balance > 0 ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950' : ledgerSummary.balance < 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950' : 'bg-gray-50 dark:bg-gray-800/50'
                            }`}>
                              <Wallet className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto mb-1 ${
                                ledgerSummary.balance > 0 ? 'text-amber-500' : 'text-green-500'
                              }`} />
                              <p className={`text-[10px] sm:text-xs ${
                                ledgerSummary.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                              }`}>
                                {ledgerSummary.balance > 0 ? 'Due' : 'Bal.'}
                              </p>
                              <p className={`text-sm sm:text-base font-bold ${
                                ledgerSummary.balance > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                              }`}>
                                {formatPKR(Math.abs(ledgerSummary.balance))}
                              </p>
                            </div>
                          </div>

                          {/* Mobile: Card layout for ledger entries */}
                          <div className="flex flex-col gap-2 sm:hidden">
                            {ledger.map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {entry.type === 'delivery' || entry.type === 'sale' ? (
                                      <ArrowUpRight className="h-3 w-3 text-red-400" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3 text-green-400" />
                                    )}
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{entry.date}</span>
                                  </div>
                                  <span className={`text-xs font-bold font-mono ${
                                    entry.balance > 0 ? 'text-amber-600' : entry.balance < 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'
                                  }`}>
                                    Bal: {entry.balance !== 0 ? formatPKR(Math.abs(entry.balance)) : '—'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 truncate">{entry.description}</p>
                                <div className="flex items-center gap-3">
                                  {entry.debit > 0 ? (
                                    <span className="text-xs font-semibold text-red-600 font-mono">Dr: {formatPKR(entry.debit)}</span>
                                  ) : (
                                    <span className="text-xs text-gray-300 dark:text-gray-600 font-mono">Dr: —</span>
                                  )}
                                  {entry.credit > 0 ? (
                                    <span className="text-xs font-semibold text-green-600 font-mono">Cr: {formatPKR(entry.credit)}</span>
                                  ) : (
                                    <span className="text-xs text-gray-300 dark:text-gray-600 font-mono">Cr: —</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-gray-700 dark:text-gray-300">Total</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-red-600 font-mono">{formatPKR(ledgerSummary.totalDebit)}</span>
                                  <span className="text-green-600 font-mono">{formatPKR(ledgerSummary.totalCredit)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop: Ledger Table */}
                          <div className="hidden sm:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <TableHead className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-[100px]">Date</TableHead>
                                  <TableHead className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Description</TableHead>
                                  <TableHead className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-right w-[100px]">Debit</TableHead>
                                  <TableHead className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-right w-[100px]">Credit</TableHead>
                                  <TableHead className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-right w-[100px]">Balance</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ledger.map((entry, idx) => (
                                  <TableRow
                                    key={entry.id}
                                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'} hover:bg-gray-50 dark:hover:bg-gray-800`}
                                  >
                                    <TableCell className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                      {entry.date}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-700 dark:text-gray-300">
                                      <div className="flex items-center gap-2">
                                        {entry.type === 'delivery' || entry.type === 'sale' ? (
                                          <ArrowUpRight className="h-3 w-3 text-red-400 shrink-0" />
                                        ) : (
                                          <ArrowDownRight className="h-3 w-3 text-green-400 shrink-0" />
                                        )}
                                        <span className="truncate max-w-[200px]">{entry.description}</span>
                                        {entry.type === 'sale' && (
                                          <Badge className="shrink-0 text-[9px] px-1 py-0 rounded bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" variant="outline">
                                            Sale
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-mono">
                                      {entry.debit > 0 ? (
                                        <span className="text-red-600 font-semibold">
                                          {formatPKR(entry.debit)}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-mono">
                                      {entry.credit > 0 ? (
                                        <span className="text-green-600 font-semibold">
                                          {formatPKR(entry.credit)}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-mono">
                                      <span className={`font-semibold ${
                                        entry.balance > 0 ? 'text-amber-600' : entry.balance < 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'
                                      }`}>
                                        {entry.balance !== 0 ? formatPKR(Math.abs(entry.balance)) : '—'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                              <TableFooter>
                                <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <TableCell className="text-xs font-bold text-gray-700 dark:text-gray-300" colSpan={2}>
                                    Total
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-mono font-bold text-red-600">
                                    {formatPKR(ledgerSummary.totalDebit)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-mono font-bold text-green-600">
                                    {formatPKR(ledgerSummary.totalCredit)}
                                  </TableCell>
                                  <TableCell className={`text-xs text-right font-mono font-bold ${
                                    ledgerSummary.balance > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                                  }`}>
                                    {formatPKR(Math.abs(ledgerSummary.balance))}
                                  </TableCell>
                                </TableRow>
                              </TableFooter>
                            </Table>
                          </div>
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

      {/* ── Add Vacation Dialog ───────────────────────────────────────── */}
      <Dialog open={vacationFormOpen} onOpenChange={setVacationFormOpen}>
        <DialogContent className={isMobile ? 'w-[100vw] h-[100dvh] rounded-none p-0' : 'sm:max-w-md'}>
          <div className={isMobile ? 'flex flex-col h-full' : ''}>
            <DialogHeader className={isMobile ? 'shrink-0 px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800' : ''}>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <Umbrella className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Add Vacation
              </DialogTitle>
              <DialogDescription className="text-xs">
                Schedule a vacation period for this customer
              </DialogDescription>
            </DialogHeader>
            <div className={`space-y-4 ${isMobile ? 'flex-1 overflow-y-auto px-4 py-4' : 'py-4'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })}
                    className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })}
                    className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                    min={vacationForm.startDate || undefined}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  placeholder="Reason for vacation..."
                  value={vacationForm.notes}
                  onChange={(e) => setVacationForm({ ...vacationForm, notes: e.target.value })}
                  className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[60px]"
                />
              </div>
            </div>
            <div className={`flex items-center gap-3 ${isMobile ? 'shrink-0 px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900' : 'pt-2'}`}>
              <Button
                variant="outline"
                onClick={() => setVacationFormOpen(false)}
                className="rounded-xl min-h-[44px] flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVacation}
                disabled={vacationLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl min-h-[44px] flex-1 sm:flex-none"
              >
                {vacationLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Add Vacation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Product Dialog ────────────────────────────────────────── */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className={isMobile ? 'w-[100vw] h-[100dvh] rounded-none p-0' : 'sm:max-w-md'}>
          <div className={isMobile ? 'flex flex-col h-full' : ''}>
            <DialogHeader className={isMobile ? 'shrink-0 px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800' : ''}>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                  <ShoppingCart className="h-3.5 w-3.5 text-green-600" />
                </div>
                Add Daily Product
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add a product to the customer&apos;s daily delivery plan
              </DialogDescription>
            </DialogHeader>
            <div className={`space-y-4 ${isMobile ? 'flex-1 overflow-y-auto px-4 py-4' : 'py-4'}`}>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Product <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={productForm.itemId}
                  onValueChange={(v) => setProductForm({ ...productForm, itemId: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 w-full min-h-[44px]">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${CATEGORY_COLORS[item.category] || 'bg-gray-400'}`} />
                          {item.name} — {formatPKR(item.pricePerUnit)}/{item.unit}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableProducts.length === 0 && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">All available products have been added already</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Daily Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={productForm.dailyQty}
                  onChange={(e) => setProductForm({ ...productForm, dailyQty: parseFloat(e.target.value) || 0 })}
                  className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                />
              </div>
              {productForm.itemId && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Daily Cost</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatPKR(
                      productForm.dailyQty *
                        (inventoryItems.find((i) => i.id === productForm.itemId)?.pricePerUnit || 0)
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-3 ${isMobile ? 'shrink-0 px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900' : 'pt-2'}`}>
              <Button
                variant="outline"
                onClick={() => setProductFormOpen(false)}
                className="rounded-xl min-h-[44px] flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={productLoading || !productForm.itemId}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl min-h-[44px] flex-1 sm:flex-none"
              >
                {productLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Product Quantity Dialog ──────────────────────────────── */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Edit Quantity
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingProduct ? `Update daily quantity for ${editingProduct.item.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Daily Quantity</Label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={editProductQty}
                onChange={(e) => setEditProductQty(e.target.value)}
                className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
              />
            </div>
            {editingProduct && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">New Daily Cost</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatPKR((parseFloat(editProductQty) || 0) * editingProduct.item.pricePerUnit)}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditProductOpen(false)}
              className="rounded-xl min-h-[44px] flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProduct}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl min-h-[44px] flex-1 sm:flex-none"
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Customer Dialog ────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden sm:rounded-lg !top-0 !left-0 !translate-x-0 !translate-y-0 sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] w-screen h-[100dvh] sm:w-full sm:h-auto sm:max-h-[92vh] rounded-none">
          <div className="flex flex-col h-full sm:max-h-[92vh]">
            <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <DialogTitle className="text-lg">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingCustomer
                  ? 'Update customer information below'
                  : 'Fill in the details to add a new customer'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Customer name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0300-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
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
                    <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 w-full min-h-[44px]">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="Street, building, landmark..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dailyQty" className="text-sm font-medium">
                    Daily Qty (Liters)
                  </Label>
                  <Input
                    id="dailyQty"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={form.dailyQty}
                    onChange={(e) =>
                      setForm({ ...form, dailyQty: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Milk Type</Label>
                  <Select
                    value={form.milkType}
                    onValueChange={(v) => {
                      const selected = milkTypes.find((m) => m.name === v)
                      setForm({
                        ...form,
                        milkType: v,
                        pricePerLiter: selected ? selected.pricePerLiter : form.pricePerLiter,
                      })
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 w-full min-h-[44px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {milkTypes.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name} (₨{m.pricePerLiter}/L)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pricePerLiter" className="text-sm font-medium">
                    Price per Liter (₨)
                  </Label>
                  <Input
                    id="pricePerLiter"
                    type="number"
                    min={0}
                    value={form.pricePerLiter}
                    onChange={(e) =>
                      setForm({ ...form, pricePerLiter: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Delivery Time</Label>
                  <Select
                    value={form.deliveryTime}
                    onValueChange={(v) => setForm({ ...form, deliveryTime: v })}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 w-full min-h-[44px]">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryTimes.map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-100 dark:border-green-900 p-3 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium dark:text-green-300">Estimated Monthly Bill</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">
                  {formatPKR(calcMonthlyBill(form.dailyQty, form.pricePerLiter))}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-lg border-gray-200 dark:border-gray-700 min-h-[60px]"
                />
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl min-h-[44px] flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={formLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl min-h-[44px] flex-1 sm:flex-none"
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer and all their delivery, payment, product, and vacation records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
