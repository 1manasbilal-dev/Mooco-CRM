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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  pricePerUnit: number
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

const formatPKR = (amount: number) => `₨${amount.toLocaleString()}`

const categoryConfig: Record<string, { color: string; bg: string }> = {
  Milk: { color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  Yogurt: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  Butter: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Cream: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  Eggs: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  Paneer: { color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  Other: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showEditItemDialog, setShowEditItemDialog] = useState(false)
  const [showRecordSaleDialog, setShowRecordSaleDialog] = useState(false)
  const [showSalesHistoryDialog, setShowSalesHistoryDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([])

  // Add item form
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('Milk')
  const [itemUnit, setItemUnit] = useState('liters')
  const [itemPrice, setItemPrice] = useState('')

  // Record sale form
  const [saleQty, setSaleQty] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleNotes, setSaleNotes] = useState('')

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

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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

  const handleRecordSale = async () => {
    if (!selectedItem || !saleQty || !saleDate) {
      toast.error('Quantity and date are required')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: parseFloat(saleQty),
          date: saleDate,
          notes: saleNotes,
        }),
      })
      if (res.ok) {
        toast.success(`Sale recorded: ${saleQty} ${selectedItem.unit} of ${selectedItem.name}`)
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

  const resetItemForm = () => {
    setItemName('')
    setItemCategory('Milk')
    setItemUnit('liters')
    setItemPrice('')
  }

  const resetSaleForm = () => {
    setSaleQty('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setSaleNotes('')
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

  // Summary calculations
  const totalItems = items.length
  const totalSoldToday = items.reduce((sum, i) => sum + i.todaySold, 0)
  const totalRevenueToday = items.reduce((sum, i) => sum + i.todayRevenue, 0)
  const categoriesSold = new Set(items.filter(i => i.todaySold > 0).map(i => i.category)).size

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  // Category counts
  const categoryCounts: Record<string, number> = {}
  items.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })

  const categories = ['all', 'Milk', 'Yogurt', 'Butter', 'Cream', 'Eggs', 'Paneer', 'Other']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500">Manage dairy products & daily sales</p>
          </div>
        </div>
        <Button
          onClick={() => { resetItemForm(); setShowAddItemDialog(true) }}
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '—' : totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sold Today</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '—' : totalSoldToday.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '—' : formatPKR(totalRevenueToday)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Categories Active</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '—' : categoriesSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filteredItems.length} products
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`
              shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all
              ${categoryFilter === cat
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {cat === 'all' ? 'All' : cat}
            {cat !== 'all' && categoryCounts[cat] ? (
              <span className="ml-1.5 text-xs opacity-70">({categoryCounts[cat]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Milk className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first dairy product to get started</p>
            <Button
              onClick={() => setShowAddItemDialog(true)}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const catStyle = categoryConfig[item.category] || categoryConfig.Other
            return (
              <Card key={item.id} className="rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0 ${catStyle.bg} ${catStyle.color}`}>
                          {item.category}
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
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Add New Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Full Cream Milk"
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Milk">Milk</SelectItem>
                    <SelectItem value="Yogurt">Yogurt</SelectItem>
                    <SelectItem value="Butter">Butter</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                    <SelectItem value="Eggs">Eggs</SelectItem>
                    <SelectItem value="Paneer">Paneer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={itemUnit} onValueChange={setItemUnit}>
                  <SelectTrigger className="rounded-lg">
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
              <Label>Price per Unit (PKR) *</Label>
              <Input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0"
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Product Name *</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Milk">Milk</SelectItem>
                    <SelectItem value="Yogurt">Yogurt</SelectItem>
                    <SelectItem value="Butter">Butter</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                    <SelectItem value="Eggs">Eggs</SelectItem>
                    <SelectItem value="Paneer">Paneer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={itemUnit} onValueChange={setItemUnit}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
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
              <Label>Price per Unit (PKR) *</Label>
              <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditItemDialog(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleEditItem} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={showRecordSaleDialog} onOpenChange={setShowRecordSaleDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Record Sale — {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity ({selectedItem?.unit}) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={saleQty}
                  onChange={(e) => setSaleQty(e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
            {saleQty && selectedItem && (
              <div className="rounded-lg bg-green-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-green-700 text-lg">
                    {formatPKR(parseFloat(saleQty) * selectedItem.pricePerUnit)}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Optional notes..."
                className="rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordSaleDialog(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleRecordSale} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales History Dialog */}
      <Dialog open={showSalesHistoryDialog} onOpenChange={setShowSalesHistoryDialog}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Sales History — {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {salesHistory.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sales recorded yet</p>
            ) : (
              <div className="space-y-2">
                {salesHistory.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {sale.quantity} {sale.item?.unit}
                      </p>
                      <p className="text-xs text-gray-400">{sale.date}</p>
                      {sale.notes && <p className="text-xs text-gray-500 mt-0.5">{sale.notes}</p>}
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      {formatPKR(sale.quantity * (sale.item?.pricePerUnit ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
