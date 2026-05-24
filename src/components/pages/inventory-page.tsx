'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Package,
  Plus,
  ShoppingCart,
  Edit,
  Trash2,
  Loader2,
  Search,
  TrendingUp,
  IndianRupee,
  Milk,
  CheckSquare,
  X,
  Power,
  PowerOff,
  History,
  Settings2,
  Check,
  UserCircle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  pricePerUnit: number
  status: string
  todaySold: number
  todayRevenue: number
  salesCount: number
}

interface SaleRecord {
  id: string
  itemId: string
  quantity: number
  date: string
  notes: string
  item: { name: string; category: string; unit: string; pricePerUnit: number }
  createdAt: string
}

interface Category {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface ActiveCustomer {
  id: string
  name: string
  phone: string
  area: string
}

const formatPKR = (amount: number) => `₨${amount.toLocaleString()}`

const categoryConfig: Record<string, { color: string; bg: string; dot: string }> = {
  Milk: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  Yogurt: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  Butter: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  Cream: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  Eggs: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  Paneer: { color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200', dot: 'bg-pink-500' },
  Other: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-500' },
}

const getCategoryStyle = (catName: string) => categoryConfig[catName] || categoryConfig.Other

const statusFilters = ['all', 'Active', 'Inactive'] as const

export default function InventoryPage() {
  const isMobile = useIsMobile()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showEditItemDialog, setShowEditItemDialog] = useState(false)
  const [showRecordSaleDialog, setShowRecordSaleDialog] = useState(false)
  const [showSalesHistoryDialog, setShowSalesHistoryDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([])

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Dynamic categories
  const [apiCategories, setApiCategories] = useState<Category[]>([])
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [catSaving, setCatSaving] = useState(false)

  // Active customers for sale dialog
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomer[]>([])

  // Add item form
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemUnit, setItemUnit] = useState('liters')
  const [itemPrice, setItemPrice] = useState('')

  // Record sale form
  const [saleQty, setSaleQty] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleNotes, setSaleNotes] = useState('')
  const [saleCustomerId, setSaleCustomerId] = useState('')

  // ── Fetch Functions ──────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setApiCategories(data)
      }
    } catch {
      toast.error('Failed to load categories')
    }
  }, [])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?status=Active')
      if (res.ok) {
        const data = await res.json()
        setActiveCustomers(Array.isArray(data) ? data : data.customers || [])
      }
    } catch {
      // Silent fail — customers are optional in sale dialog
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchCustomers()
  }, [fetchItems, fetchCategories, fetchCustomers])

  // ── Category CRUD ────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      setCatSaving(true)
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      })
      if (res.ok) {
        toast.success(`Category "${newCatName.trim()}" added`)
        setNewCatName('')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add category')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCatSaving(false)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      setCatSaving(true)
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCatName.trim() }),
      })
      if (res.ok) {
        toast.success('Category updated')
        setEditingCatId(null)
        setEditingCatName('')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update category')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Category "${name}" deleted`)
        fetchCategories()
      } else {
        toast.error('Failed to delete category')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  // ── Item CRUD ────────────────────────────────────────────────

  const handleAddItem = async () => {
    if (!itemName || !itemPrice) {
      toast.error('Name and price are required')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          category: itemCategory,
          unit: itemUnit,
          pricePerUnit: parseFloat(itemPrice),
        }),
      })
      if (res.ok) {
        toast.success(`${itemName} added successfully`)
        setShowAddItemDialog(false)
        resetItemForm()
        fetchItems()
      } else {
        toast.error('Failed to add item')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleEditItem = async () => {
    if (!selectedItem || !itemName || !itemPrice) return
    try {
      setSaving(true)
      const res = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          category: itemCategory,
          unit: itemUnit,
          pricePerUnit: parseFloat(itemPrice),
        }),
      })
      if (res.ok) {
        toast.success('Item updated')
        setShowEditItemDialog(false)
        resetItemForm()
        fetchItems()
      }
    } catch {
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return
    try {
      setSaving(true)
      const res = await fetch(`/api/inventory/${selectedItem.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Item deleted')
        setShowDeleteDialog(false)
        setSelectedItem(null)
        fetchItems()
      }
    } catch {
      toast.error('Failed to delete item')
    } finally {
      setSaving(false)
    }
  }

  // ── Record Sale ──────────────────────────────────────────────

  const handleRecordSale = async () => {
    if (!selectedItem || !saleQty || !saleDate) {
      toast.error('Quantity and date are required')
      return
    }
    try {
      setSaving(true)
      const body: Record<string, unknown> = {
        itemId: selectedItem.id,
        quantity: parseFloat(saleQty),
        date: saleDate,
        notes: saleNotes,
      }
      if (saleCustomerId) {
        body.customerId = saleCustomerId
      }
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const saleRes = await res.json()
        const customerName = saleCustomerId
          ? activeCustomers.find(c => c.id === saleCustomerId)?.name
          : null
        let msg = `Sale recorded: ${saleQty} ${selectedItem.unit} of ${selectedItem.name}`
        if (customerName) {
          msg += ` → ${customerName}`
        }
        toast.success(msg)
        if (saleCustomerId) {
          toast.info('Delivery & ledger entry created for customer')
        }
        setShowRecordSaleDialog(false)
        resetSaleForm()
        fetchItems()
      } else {
        toast.error('Failed to record sale')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = async (action: 'Active' | 'Inactive' | 'delete') => {
    if (selectedIds.size === 0) return
    try {
      setBulkActionLoading(true)
      const res = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        const count = selectedIds.size
        if (action === 'delete') {
          toast.success(`${count} product${count > 1 ? 's' : ''} deleted`)
        } else {
          toast.success(`${count} product${count > 1 ? 's' : ''} set to ${action}`)
        }
        setSelectedIds(new Set())
        fetchItems()
      } else {
        toast.error('Bulk action failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const fetchSalesHistory = async (itemId: string) => {
    try {
      const res = await fetch(`/api/sales?itemId=${itemId}&startDate=${getDateStr(7)}&endDate=${new Date().toISOString().split('T')[0]}`)
      if (res.ok) {
        const data = await res.json()
        setSalesHistory(data)
      }
    } catch {
      toast.error('Failed to load sales history')
    }
  }

  // ── Form Helpers ─────────────────────────────────────────────

  const resetItemForm = () => {
    setItemName('')
    setItemCategory(apiCategories.length > 0 ? apiCategories[0].name : 'Milk')
    setItemUnit('liters')
    setItemPrice('')
  }

  const resetSaleForm = () => {
    setSaleQty('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setSaleNotes('')
    setSaleCustomerId('')
  }

  const openEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setItemName(item.name)
    setItemCategory(item.category)
    setItemUnit(item.unit)
    setItemPrice(item.pricePerUnit.toString())
    setShowEditItemDialog(true)
  }

  const openRecordSale = (item: InventoryItem) => {
    setSelectedItem(item)
    resetSaleForm()
    setShowRecordSaleDialog(true)
  }

  const openSalesHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    fetchSalesHistory(item.id)
    setShowSalesHistoryDialog(true)
  }

  const getDateStr = (daysAgo: number) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  // Toggle selection for a single item
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select/deselect all filtered items
  const toggleSelectAll = () => {
    const filteredIds = filteredItems.map(i => i.id)
    const allSelected = filteredIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredIds))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // ── Computed Values ──────────────────────────────────────────

  // Build category tabs from API data
  const categoryTabNames = ['all', ...apiCategories.map(c => c.name)]

  // Summary calculations
  const totalItems = items.length
  const totalSoldToday = items.reduce((sum, i) => sum + i.todaySold, 0)
  const totalRevenueToday = items.reduce((sum, i) => sum + i.todayRevenue, 0)
  const categoriesSold = new Set(items.filter(i => i.todaySold > 0).map(i => i.category)).size

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchCategory && matchSearch && matchStatus
  })

  // Category counts
  const categoryCounts: Record<string, number> = {}
  items.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })

  // Check if all filtered items are selected
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id))
  const someFilteredSelected = filteredItems.some(i => selectedIds.has(i.id)) && !allFilteredSelected

  // ── Category Select Items (shared between Add & Edit dialogs) ──
  const categorySelectItems = apiCategories.map(cat => (
    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
  ))

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-24">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
            <Package className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Inventory</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage dairy products & daily sales</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowManageCategories(true)}
            className="rounded-lg h-10 sm:h-9 px-2.5 sm:px-3 border-gray-200"
            title="Manage Categories"
          >
            <Settings2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Categories</span>
          </Button>
          <Button
            onClick={() => { resetItemForm(); setShowAddItemDialog(true) }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-10 sm:h-9 px-3 sm:px-4 shrink-0"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-xl border-gray-200 shadow-sm bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-sm text-gray-500 leading-tight">Products</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">{loading ? '—' : totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-sm text-gray-500 leading-tight">Sold Today</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">{loading ? '—' : totalSoldToday.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-sm text-gray-500 leading-tight">Revenue</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">{loading ? '—' : formatPKR(totalRevenueToday)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-sm text-gray-500 leading-tight">Categories</p>
                <p className="text-base sm:text-xl font-bold text-gray-900">{loading ? '—' : categoriesSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter & Search Bar ───────────────────────────── */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Top row: Select All + Search + Count */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Checkbox
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someFilteredSelected
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all products"
                  className="h-5 w-5 sm:h-4 sm:w-4"
                />
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">All</span>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 h-11 sm:h-9 bg-gray-50 border-gray-200 rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                {filteredItems.length} items
              </span>
            </div>
            {/* Bottom row: Status filters + count on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    shrink-0 rounded-full px-3 py-1.5 sm:py-1 text-xs font-medium transition-all min-h-[36px] sm:min-h-0
                    ${statusFilter === status
                      ? status === 'Active'
                        ? 'bg-green-500 text-white shadow-sm'
                        : status === 'Inactive'
                          ? 'bg-gray-500 text-white shadow-sm'
                          : 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                    }
                  `}
                >
                  {status === 'all' ? 'All Status' : status}
                </button>
              ))}
              <span className="text-xs text-gray-400 whitespace-nowrap ml-auto sm:hidden">
                {filteredItems.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Category Tabs ─────────────────────────────────── */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {categoryTabNames.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`
              shrink-0 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all min-h-[36px] sm:min-h-0
              ${categoryFilter === cat
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {cat === 'all' ? 'All' : cat}
            {cat !== 'all' && categoryCounts[cat] ? (
              <span className="ml-1 text-[10px] sm:text-xs opacity-70">({categoryCounts[cat]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Items List ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Milk className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-base font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first dairy product to get started</p>
            <Button
              onClick={() => { resetItemForm(); setShowAddItemDialog(true) }}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Compact list layout */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filteredItems.map((item) => {
              const catStyle = getCategoryStyle(item.category)
              const isSelected = selectedIds.has(item.id)
              const isInactive = item.status === 'Inactive'
              return (
                <Card
                  key={item.id}
                  className={`
                    rounded-xl border-gray-200 shadow-sm transition-all duration-200 relative
                    ${isInactive ? 'opacity-60' : ''}
                    ${isSelected ? 'ring-2 ring-green-500 ring-offset-1 bg-green-50/30' : 'bg-white'}
                  `}
                >
                  <CardContent className="p-3">
                    {/* Row 1: Checkbox + Name + Category + Price */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="shrink-0 h-11 w-11 flex items-center justify-center rounded-lg active:bg-gray-100 -ml-1"
                        aria-label={`Select ${item.name}`}
                      >
                        <div className={`
                          h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all
                          ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'}
                        `}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`}></span>
                            {item.category}
                          </span>
                          {isInactive && (
                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">₨{item.pricePerUnit}/{item.unit}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-green-700 font-medium">{item.todaySold.toFixed(1)} {item.unit} today</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs font-semibold text-green-700">{formatPKR(item.todayRevenue)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Row 2: Action buttons */}
                    <div className="flex items-center gap-1.5 mt-2.5 ml-10">
                      <Button
                        onClick={() => openRecordSale(item)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 rounded-lg text-xs font-medium"
                        disabled={isInactive}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        Record Sale
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openSalesHistory(item)}
                        className="h-9 w-9 rounded-lg shrink-0"
                        title="Sales History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditItem(item)}
                        className="h-9 w-9 rounded-lg shrink-0"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setSelectedItem(item); setShowDeleteDialog(true) }}
                        className="h-9 w-9 rounded-lg shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desktop: Card grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const catStyle = getCategoryStyle(item.category)
              const isSelected = selectedIds.has(item.id)
              const isInactive = item.status === 'Inactive'
              return (
                <Card
                  key={item.id}
                  className={`
                    rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative
                    ${isInactive ? 'opacity-60' : ''}
                    ${isSelected ? 'ring-2 ring-green-500 ring-offset-1' : ''}
                  `}
                >
                  <CardContent className="p-5">
                    {/* Top row: Checkbox + Name + Status Badge */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0 ${catStyle.bg} ${catStyle.color}`}>
                            {item.category}
                          </Badge>
                          <Badge
                            className={`shrink-0 text-[10px] px-2 py-0 border-0 ${
                              item.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.status === 'Active' ? '● Active' : '○ Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          ₨{item.pricePerUnit} / {item.unit}
                        </p>
                      </div>
                    </div>

                    {/* Today's Sales */}
                    <div className="rounded-lg bg-gray-50 p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Today&apos;s Sale</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          {item.todaySold.toFixed(1)} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                          {formatPKR(item.todayRevenue)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => openRecordSale(item)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 rounded-lg text-sm"
                        disabled={isInactive}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Record Sale
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openSalesHistory(item)}
                        className="h-9 w-9 rounded-lg shrink-0"
                        title="Sales History"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditItem(item)}
                        className="h-9 w-9 rounded-lg shrink-0"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setSelectedItem(item); setShowDeleteDialog(true) }}
                        className="h-9 w-9 rounded-lg shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* ── Bulk Action Bar ───────────────────────────────── */}
      <div
        className={`
          fixed bottom-[64px] sm:bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${selectedIds.size > 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
          }
        `}
      >
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
              {/* Left: Selection info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shrink-0">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                  <span className="hidden sm:inline">{selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected</span>
                  <span className="sm:hidden">{selectedIds.size} selected</span>
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                {/* Mobile: icon-only buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleBulkAction('Active')}
                  disabled={bulkActionLoading}
                  className="h-10 w-10 sm:hidden rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 shrink-0"
                  title="Set Active"
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleBulkAction('Inactive')}
                  disabled={bulkActionLoading}
                  className="h-10 w-10 sm:hidden rounded-lg text-gray-600 border-gray-200 hover:bg-gray-50 shrink-0"
                  title="Set Inactive"
                >
                  <PowerOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="h-10 w-10 sm:hidden rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                  title="Delete"
                >
                  {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelection}
                  className="h-10 w-10 sm:hidden rounded-lg text-gray-500 hover:text-gray-700 shrink-0"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
                {/* Desktop: buttons with labels */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Active')}
                  disabled={bulkActionLoading}
                  className="hidden sm:flex rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 whitespace-nowrap"
                >
                  <Power className="h-3.5 w-3.5 mr-1.5" />
                  Set Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Inactive')}
                  disabled={bulkActionLoading}
                  className="hidden sm:flex rounded-lg text-gray-600 border-gray-200 hover:bg-gray-50 whitespace-nowrap"
                >
                  <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                  Set Inactive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="hidden sm:flex rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
                >
                  {bulkActionLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                  Delete
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="hidden sm:flex rounded-lg text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Item Dialog ───────────────────────────────── */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              Add New Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Product Name *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Full Cream Milk"
                className="rounded-lg h-11 sm:h-9 mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="rounded-lg h-11 sm:h-9 mt-1.5">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorySelectItems}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Unit</Label>
                <Select value={itemUnit} onValueChange={setItemUnit}>
                  <SelectTrigger className="rounded-lg h-11 sm:h-9 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Price per Unit (PKR) *</Label>
              <Input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0"
                className="rounded-lg h-11 sm:h-9 mt-1.5"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)} className="rounded-lg h-11 sm:h-9 w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-11 sm:h-9 w-full sm:w-auto"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Item Dialog ──────────────────────────────── */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Edit className="h-4 w-4 text-green-600" />
              </div>
              Edit Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Product Name *</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} className="rounded-lg h-11 sm:h-9 mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="rounded-lg h-11 sm:h-9 mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {categorySelectItems}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Unit</Label>
                <Select value={itemUnit} onValueChange={setItemUnit}>
                  <SelectTrigger className="rounded-lg h-11 sm:h-9 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Price per Unit (PKR) *</Label>
              <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="rounded-lg h-11 sm:h-9 mt-1.5" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowEditItemDialog(false)} className="rounded-lg h-11 sm:h-9 w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleEditItem} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-11 sm:h-9 w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Record Sale Dialog ────────────────────────────── */}
      <Dialog open={showRecordSaleDialog} onOpenChange={setShowRecordSaleDialog}>
        <DialogContent className={`sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0' : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
              <span className="truncate">Record Sale — {selectedItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Product info card */}
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Product</span>
                <span className="font-medium">{selectedItem?.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Price</span>
                <span className="font-medium">₨{selectedItem?.pricePerUnit} / {selectedItem?.unit}</span>
              </div>
            </div>

            {/* Customer Selection */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                Customer
                <span className="text-amber-600 text-xs font-normal">(recommended)</span>
              </Label>
              <Select value={saleCustomerId} onValueChange={setSaleCustomerId}>
                <SelectTrigger className="rounded-lg h-11 sm:h-9 mt-1.5">
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}{customer.phone ? ` · ${customer.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-start gap-1.5 mt-2 px-0.5">
                <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] sm:text-xs text-amber-700 leading-snug">
                  Select a customer to automatically add this sale to their delivery & ledger
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Quantity ({selectedItem?.unit}) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={saleQty}
                  onChange={(e) => setSaleQty(e.target.value)}
                  placeholder="0"
                  className="rounded-lg h-11 sm:h-9 mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="rounded-lg h-11 sm:h-9 mt-1.5"
                />
              </div>
            </div>
            {saleQty && selectedItem && (
              <div className="rounded-lg bg-green-50 p-3 border border-green-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-green-700 text-lg">
                    {formatPKR(parseFloat(saleQty) * selectedItem.pricePerUnit)}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Optional notes..."
                className="rounded-lg mt-1.5"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowRecordSaleDialog(false)} className="rounded-lg h-11 sm:h-9 w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleRecordSale} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-11 sm:h-9 w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sales History Dialog ──────────────────────────── */}
      <Dialog open={showSalesHistoryDialog} onOpenChange={setShowSalesHistoryDialog}>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <History className="h-4 w-4 text-green-600" />
              </div>
              <span className="truncate">Sales History — {selectedItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {salesHistory.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm text-center">No sales recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {sale.quantity} {sale.item?.unit}
                      </p>
                      <p className="text-xs text-gray-400">{sale.date}</p>
                      {sale.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{sale.notes}</p>}
                    </div>
                    <span className="text-sm font-semibold text-green-700 shrink-0 ml-3">
                      {formatPKR(sale.quantity * (sale.item?.pricePerUnit ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Manage Categories Dialog ──────────────────────── */}
      <Dialog open={showManageCategories} onOpenChange={(open) => {
        setShowManageCategories(open)
        if (!open) {
          setNewCatName('')
          setEditingCatId(null)
          setEditingCatName('')
        }
      }}>
        <DialogContent className={`sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0' : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Settings2 className="h-4 w-4 text-green-600" />
              </div>
              Manage Categories
            </DialogTitle>
          </DialogHeader>

          {/* Add new category */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..."
              className="rounded-lg h-11 sm:h-9 flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
            />
            <Button
              onClick={handleAddCategory}
              disabled={catSaving || !newCatName.trim()}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-11 sm:h-9 px-4 shrink-0"
            >
              {catSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="sm:ml-1.5 hidden sm:inline">Add</span>
            </Button>
          </div>

          {/* Category list */}
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto mt-2">
            {apiCategories.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Settings2 className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">No categories yet</p>
              </div>
            ) : (
              apiCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2"
                >
                  {editingCatId === cat.id ? (
                    <>
                      <Input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="rounded-lg h-9 flex-1 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleUpdateCategory(cat.id)
                          }
                          if (e.key === 'Escape') {
                            setEditingCatId(null)
                            setEditingCatName('')
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateCategory(cat.id)}
                        disabled={catSaving}
                        className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Save"
                      >
                        {catSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingCatId(null); setEditingCatName('') }}
                        className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getCategoryStyle(cat.name).dot}`} />
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                        className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManageCategories(false)}
              className="rounded-lg h-11 sm:h-9 w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? All its sales history will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
