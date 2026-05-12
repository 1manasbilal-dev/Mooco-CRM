'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  PackageX,
  TrendingDown,
  Clock,
  IndianRupee,
  ShoppingCart,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────
interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  openingStock: number
  purchasedStock: number
  soldStock: number
  currentStock: number
  minStock: number
  pricePerUnit: number
  expiryDate: string | null
  createdAt: string
  updatedAt: string
  stockStatus?: string
}

// ── Constants ───────────────────────────────────────────────────────────
const CATEGORIES = ['Milk', 'Yogurt', 'Butter', 'Cream', 'Eggs', 'Paneer', 'Other']
const UNITS = ['liters', 'kg', 'dozen', 'pieces']

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Milk: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Yogurt: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Butter: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Cream: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Eggs: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Paneer: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
}

const EMPTY_FORM = {
  name: '',
  category: 'Milk',
  unit: 'liters',
  openingStock: 0,
  purchasedStock: 0,
  soldStock: 0,
  currentStock: 0,
  minStock: 5,
  pricePerUnit: 0,
  expiryDate: '',
}

// ── Helpers ─────────────────────────────────────────────────────────────
function formatPKR(amount: number): string {
  return '₨' + amount.toLocaleString('en-PK')
}

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getStockBarColor(current: number, min: number): string {
  if (current < min) return 'bg-red-500'
  if (current < min * 2) return 'bg-amber-500'
  return 'bg-green-500'
}

function getStockBarValue(current: number, min: number): number {
  const maxDisplay = Math.max(min * 3, current, 1)
  return Math.min(Math.round((current / maxDisplay) * 100), 100)
}

function getExpiryInfo(dateStr: string | null): { label: string; color: string } | null {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return null
  if (days < 0) return { label: 'Expired', color: 'text-red-600' }
  if (days === 0) return { label: 'Expires today', color: 'text-red-600' }
  if (days === 1) return { label: '1 day left', color: 'text-amber-600' }
  if (days <= 3) return { label: `${days} days left`, color: 'text-amber-600' }
  return { label: `${days} days left`, color: 'text-gray-500' }
}

// ── Component ───────────────────────────────────────────────────────────
export default function InventoryPage() {
  // State
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Form dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // Quick stock
  const [addStockQty, setAddStockQty] = useState(0)
  const [sellStockQty, setSellStockQty] = useState(0)
  const [quickLoading, setQuickLoading] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)

  // ── Fetch inventory ─────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Computed values ─────────────────────────────────────────────────
  const filteredItems =
    categoryFilter === 'All'
      ? items
      : items.filter((i) => i.category === categoryFilter)

  const lowStockItems = items.filter((i) => i.currentStock < i.minStock)

  const expiringSoonItems = items.filter((i) => {
    const days = daysUntilExpiry(i.expiryDate)
    return days !== null && days >= 0 && days <= 3
  })

  const expiredItems = items.filter((i) => {
    const days = daysUntilExpiry(i.expiryDate)
    return days !== null && days < 0
  })

  const totalStockValue = items.reduce(
    (sum, i) => sum + i.currentStock * i.pricePerUnit,
    0
  )

  const categoryCounts: Record<string, number> = { All: items.length }
  CATEGORIES.forEach((cat) => {
    categoryCounts[cat] = items.filter((i) => i.category === cat).length
  })

  // ── Form helpers ────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setEditingItem(null)
    setAddStockQty(0)
    setSellStockQty(0)
  }

  const openAddForm = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      openingStock: item.openingStock,
      purchasedStock: item.purchasedStock,
      soldStock: item.soldStock,
      currentStock: item.currentStock,
      minStock: item.minStock,
      pricePerUnit: item.pricePerUnit,
      expiryDate: item.expiryDate || '',
    })
    setAddStockQty(0)
    setSellStockQty(0)
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Product name is required')
      return
    }
    setFormLoading(true)
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        openingStock: Number(form.openingStock) || 0,
        purchasedStock: Number(form.purchasedStock) || 0,
        soldStock: Number(form.soldStock) || 0,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
        pricePerUnit: Number(form.pricePerUnit) || 0,
        expiryDate: form.expiryDate || null,
      }

      if (editingItem) {
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Product updated successfully')
      } else {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Product added successfully')
      }
      setFormOpen(false)
      resetForm()
      fetchItems()
    } catch {
      toast.error(editingItem ? 'Failed to update product' : 'Failed to add product')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Quick stock actions ─────────────────────────────────────────────
  const handleAddStock = async () => {
    if (!editingItem || addStockQty <= 0) return
    setQuickLoading(true)
    try {
      const newPurchased = editingItem.purchasedStock + addStockQty
      const newCurrent = editingItem.currentStock + addStockQty
      const res = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchasedStock: newPurchased,
          currentStock: newCurrent,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Added ${addStockQty} ${editingItem.unit} of ${editingItem.name}`)
      setEditingItem({ ...editingItem, purchasedStock: newPurchased, currentStock: newCurrent })
      setForm((prev) => ({
        ...prev,
        purchasedStock: newPurchased,
        currentStock: newCurrent,
      }))
      setAddStockQty(0)
      fetchItems()
    } catch {
      toast.error('Failed to add stock')
    } finally {
      setQuickLoading(false)
    }
  }

  const handleRecordSale = async () => {
    if (!editingItem || sellStockQty <= 0) return
    setQuickLoading(true)
    try {
      const newSold = editingItem.soldStock + sellStockQty
      const newCurrent = editingItem.currentStock - sellStockQty
      const res = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soldStock: newSold,
          currentStock: newCurrent,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Recorded sale of ${sellStockQty} ${editingItem.unit} of ${editingItem.name}`)
      setEditingItem({ ...editingItem, soldStock: newSold, currentStock: newCurrent })
      setForm((prev) => ({
        ...prev,
        soldStock: newSold,
        currentStock: newCurrent,
      }))
      setSellStockQty(0)
      fetchItems()
    } catch {
      toast.error('Failed to record sale')
    } finally {
      setQuickLoading(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      const res = await fetch(`/api/inventory/${deletingItem.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Product deleted')
      setDeleteOpen(false)
      setDeletingItem(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500">Manage dairy product stock levels</p>
          </div>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
        >
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      {/* ── Low Stock Alert ──────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <Card className="rounded-xl border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-red-800">Low Stock Alert</h3>
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px] px-2 py-0.5 rounded-md">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-sm text-red-600 mb-2">
                  Restock needed — the following items are below minimum stock levels:
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.map((item) => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className="bg-white text-red-700 border-red-200 text-xs px-2.5 py-1 rounded-md"
                    >
                      <PackageX className="h-3 w-3 mr-1" />
                      {item.name}: {item.currentStock} / {item.minStock} {item.unit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Package className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className={`text-xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Expiring Soon</p>
                <p className={`text-xl font-bold ${(expiringSoonItems.length + expiredItems.length) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {expiringSoonItems.length + expiredItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Value</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatPKR(totalStockValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Category Filter Tabs ─────────────────────────────────────── */}
      <div className="w-full overflow-x-auto">
        <Tabs
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          className="w-full"
        >
          <TabsList className="h-10 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="All"
              className="text-xs px-3 h-8 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              All
              <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {categoryCounts['All']}
              </span>
            </TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs px-3 h-8 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {cat}
                {categoryCounts[cat] > 0 && (
                  <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {categoryCounts[cat]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Inventory Cards Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400">
              {categoryFilter !== 'All'
                ? 'No items in this category'
                : 'Add your first product to get started'}
            </p>
            {categoryFilter === 'All' && (
              <Button
                onClick={openAddForm}
                variant="outline"
                className="mt-2 border-green-200 text-green-600 hover:bg-green-50"
              >
                <Plus className="size-4" />
                Add Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other']
            const expiryInfo = getExpiryInfo(item.expiryDate)
            const isLowStock = item.currentStock < item.minStock
            const isExpired = daysUntilExpiry(item.expiryDate) !== null && (daysUntilExpiry(item.expiryDate) as number) < 0
            const isExpiringSoon = !isExpired && expiryInfo !== null && (daysUntilExpiry(item.expiryDate) as number) <= 3

            return (
              <Card
                key={item.id}
                className="rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow py-0"
              >
                <CardContent className="p-5">
                  {/* Header: Name + Category badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {item.name}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-medium ${catColor.bg} ${catColor.text} ${catColor.border}`}
                    >
                      {item.category}
                    </Badge>
                  </div>

                  {/* Low stock warning badge */}
                  {isLowStock && (
                    <div className="mb-3">
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 text-[11px] px-2 py-0.5 rounded-md"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    </div>
                  )}

                  {/* Current stock (large number with unit) */}
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {item.currentStock}
                      <span className="text-sm font-normal text-gray-500 ml-1.5">
                        {item.unit}
                      </span>
                    </p>
                  </div>

                  {/* Stock level bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400">Stock level</span>
                      <span className="text-[11px] text-gray-400">
                        Min: {item.minStock} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getStockBarColor(item.currentStock, item.minStock)}`}
                        style={{ width: `${getStockBarValue(item.currentStock, item.minStock)}%` }}
                      />
                    </div>
                  </div>

                  {/* Price & Min Stock */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        {formatPKR(item.pricePerUnit)}
                      </span>
                      <span className="text-[11px] text-gray-400">/ {item.unit}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Min: {item.minStock} {item.unit}
                    </span>
                  </div>

                  {/* Expiry date */}
                  {expiryInfo && (
                    <div
                      className={`flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-md ${
                        isExpired
                          ? 'bg-red-50'
                          : isExpiringSoon
                            ? 'bg-amber-50'
                            : 'bg-gray-50'
                      }`}
                    >
                      <Clock
                        className={`h-3 w-3 shrink-0 ${
                          isExpired
                            ? 'text-red-500'
                            : isExpiringSoon
                              ? 'text-amber-500'
                              : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-medium ${
                          isExpired
                            ? 'text-red-700'
                            : isExpiringSoon
                              ? 'text-amber-700'
                              : 'text-gray-600'
                        }`}
                      >
                        {expiryInfo.label}
                      </span>
                      {item.expiryDate && (
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {item.expiryDate}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(item)}
                      className="flex-1 h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingItem(item)
                        setDeleteOpen(true)
                      }}
                      className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Add/Edit Product Dialog ──────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) resetForm(); setFormOpen(open) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update product details and stock levels'
                : 'Fill in the details to add a new inventory item'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1 -mr-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inv-name"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Category + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm({ ...form, unit: v })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 w-full">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Opening Stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.openingStock || ''}
                  onChange={(e) =>
                    setForm({ ...form, openingStock: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Purchased Stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.purchasedStock || ''}
                  onChange={(e) =>
                    setForm({ ...form, purchasedStock: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sold Stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.soldStock || ''}
                  onChange={(e) =>
                    setForm({ ...form, soldStock: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Current Stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.currentStock || ''}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
            </div>

            {/* Min Stock + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Min Stock Level</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.minStock || ''}
                  onChange={(e) =>
                    setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Price per Unit (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.pricePerUnit || ''}
                  onChange={(e) =>
                    setForm({ ...form, pricePerUnit: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border-gray-200"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Expiry Date</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="rounded-lg border-gray-200"
              />
            </div>

            {/* Quick Stock Update (only in edit mode) */}
            {editingItem && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                    Quick Stock Update
                  </h4>

                  {/* Add Stock */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 shrink-0">
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Qty to add"
                      value={addStockQty || ''}
                      onChange={(e) =>
                        setAddStockQty(parseFloat(e.target.value) || 0)
                      }
                      className="rounded-lg border-gray-200 h-9 flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddStock}
                      disabled={addStockQty <= 0 || quickLoading}
                      className="bg-green-600 hover:bg-green-700 text-white h-9"
                    >
                      {quickLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add
                    </Button>
                  </div>

                  {/* Record Sale */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
                      <ArrowDownCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Qty sold"
                      value={sellStockQty || ''}
                      onChange={(e) =>
                        setSellStockQty(parseFloat(e.target.value) || 0)
                      }
                      className="rounded-lg border-gray-200 h-9 flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleRecordSale}
                      disabled={sellStockQty <= 0 || quickLoading}
                      className="bg-amber-600 hover:bg-amber-700 text-white h-9"
                    >
                      {quickLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                      Record
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => { setFormOpen(false); resetForm() }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formLoading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingItem ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">{deletingItem?.name}</span>?
              This action cannot be undone.
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
