'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Plus,
  RotateCcw,
  Loader2,
  Milk,
  ChevronDown,
  PackageCheck,
  Sparkles,
  AlertTriangle,
  X,
  PackagePlus,
  Ban,
  Umbrella,
} from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

// --- Types ---
interface Area {
  id: string
  name: string
}

interface Customer {
  id: string
  name: string
  area: string
  phone: string
  dailyQty: number
  milkType: string
  pricePerLiter: number
  route?: string
}

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  pricePerUnit: number
  status: string
}

interface Delivery {
  id: string
  customerId: string
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
  updatedAt: string
  customer: {
    name: string
    area: string
    phone: string
    milkType?: string
  }
}

// --- Constants ---
const ROUTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const STATUSES = ['All', 'Pending', 'Delivered', 'Missed', 'Cancelled']

const PRODUCT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Milk: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  Yogurt: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  Butter: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  Cream: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  Eggs: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  Paneer: { bg: 'bg-teal-50 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
  Ghee: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  Other: { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', dot: 'bg-gray-500' },
}

function getProductColor(productName: string) {
  // Try to match by key words in the product name
  const lower = productName.toLowerCase()
  if (lower.includes('milk')) return PRODUCT_COLORS.Milk
  if (lower.includes('yogurt') || lower.includes('yoghurt') || lower.includes('dahi')) return PRODUCT_COLORS.Yogurt
  if (lower.includes('butter') || lower.includes('makhan')) return PRODUCT_COLORS.Butter
  if (lower.includes('cream')) return PRODUCT_COLORS.Cream
  if (lower.includes('egg')) return PRODUCT_COLORS.Eggs
  if (lower.includes('paneer')) return PRODUCT_COLORS.Paneer
  if (lower.includes('ghee')) return PRODUCT_COLORS.Ghee
  return PRODUCT_COLORS.Other
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatQuantity(qty: number, unit?: string): string {
  const u = unit || 'L'
  return qty % 1 === 0 ? `${qty}${u}` : `${qty}${u}`
}

function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString()}`
}

/** Build routes dynamically from areas, mapping each area to a route letter */
function buildRoutes(areas: Area[]): { value: string; label: string }[] {
  return areas.map((area, i) => {
    const letter = ROUTE_LETTERS[i % ROUTE_LETTERS.length]
    return { value: `Route ${letter}`, label: `Route ${letter} - ${area.name}` }
  })
}

function getRouteLabel(route: string, routes: { value: string; label: string }[]): string {
  const found = routes.find((r) => r.value === route)
  return found ? found.label : route
}

function getStatusBadge(status: string, compact = false) {
  const sizeClasses = compact
    ? 'text-xs px-2 py-0.5 min-h-[24px]'
    : 'text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1 min-h-[28px] sm:min-h-[32px]'

  switch (status) {
    case 'Pending':
      return (
        <Badge className={`${sizeClasses} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950 font-medium`}>
          <Clock className="size-3 mr-1 shrink-0" />
          Pending
        </Badge>
      )
    case 'Delivered':
      return (
        <Badge className={`${sizeClasses} bg-green-50 text-green-700 border-green-200 hover:bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-950 font-medium`}>
          <CheckCircle className="size-3 mr-1 shrink-0" />
          Delivered
        </Badge>
      )
    case 'Missed':
      return (
        <Badge className={`${sizeClasses} bg-red-50 text-red-700 border-red-200 hover:bg-red-50 dark:bg-red-950 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950 font-medium`}>
          <XCircle className="size-3 mr-1 shrink-0" />
          Missed
        </Badge>
      )
    case 'Cancelled':
      return (
        <Badge className={`${sizeClasses} bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800 font-medium`}>
          <Ban className="size-3 mr-1 shrink-0" />
          Cancelled
        </Badge>
      )
    default:
      return <Badge variant="outline" className={sizeClasses}>{status}</Badge>
  }
}

// --- Main Component ---
export default function DeliveriesPage() {
  const isMobile = useIsMobile()
  const [selectedDate, setSelectedDate] = useState(getTodayStr)
  const [routeFilter, setRouteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [vacations, setVacations] = useState<Array<{ id: string; customerId: string; startDate: string; endDate: string; notes: string; customer: { name: string; area: string } }>>([])

  // Auto-generate state
  const [generating, setGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{
    created: number
    skippedVacation: number
  } | null>(null)
  const [vacationBannerDismissed, setVacationBannerDismissed] = useState(false)

  // Collapsible route groups state
  const [collapsedRoutes, setCollapsedRoutes] = useState<Record<string, boolean>>({})

  const toggleRoute = (route: string) => {
    setCollapsedRoutes((prev) => ({ ...prev, [route]: !prev[route] }))
  }

  // Derived routes from dynamic areas
  const routes = useMemo(() => buildRoutes(areas), [areas])

  // Build area-to-route mapping for vacation matching
  const areaRouteMap = useMemo(() => {
    const map: Record<string, string> = {}
    const routeLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    areas.forEach((area, i) => {
      map[area.name] = `Route ${routeLetters[i % 26]}`
    })
    return map
  }, [areas])

  // Add delivery dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newDelivery, setNewDelivery] = useState({
    customerId: '',
    date: getTodayStr(),
    quantity: 1,
    route: 'Route A',
    notes: '',
    itemId: '' as string | null,
    isExtra: false,
  })
  const [addingDelivery, setAddingDelivery] = useState(false)

  // Record Extra dialog
  const [extraDialogOpen, setExtraDialogOpen] = useState(false)
  const [extraDelivery, setExtraDelivery] = useState({
    customerId: '',
    customerName: '',
    itemId: '',
    quantity: 1,
    notes: '',
  })
  const [addingExtra, setAddingExtra] = useState(false)

  // Editing notes
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

  // --- Auto-generate deliveries ---
  const generateDeliveries = useCallback(async (date: string, silent = false) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/deliveries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()

      setGenerationResult({
        created: data.created || 0,
        skippedVacation: data.skippedVacation || 0,
      })
      setVacationBannerDismissed(false)

      if (!silent) {
        if (data.created > 0) {
          toast.success(`${data.created} deliveries generated for ${date}`, {
            description: data.skippedVacation > 0
              ? `${data.skippedVacation} customer(s) skipped (on vacation)`
              : undefined,
          })
        } else {
          toast.info('No new deliveries to generate', {
            description: 'All active customers already have deliveries for this date.',
          })
        }
      }
    } catch {
      if (!silent) toast.error('Failed to generate deliveries')
    } finally {
      setGenerating(false)
    }
  }, [])

  // Fetch deliveries for the selected date
  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('date', selectedDate)
      if (statusFilter !== 'All') params.set('status', statusFilter)
      if (routeFilter !== 'all') params.set('route', routeFilter)

      const res = await fetch(`/api/deliveries?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Delivery[] = await res.json()
      setDeliveries(data)
    } catch {
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, statusFilter, routeFilter])

  // Fetch customers for the add delivery dialog
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?status=Active')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCustomers(data)
    } catch {
      // silently fail
    }
  }, [])

  // Fetch areas for dynamic routes
  const fetchAreas = useCallback(async () => {
    try {
      const res = await fetch('/api/areas')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAreas(Array.isArray(data) ? data : [])
    } catch {
      // silently fail
    }
  }, [])

  // Fetch inventory items for extra delivery selection
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setInventoryItems(data.filter((item: InventoryItem) => item.status === 'Active'))
    } catch {
      // silently fail
    }
  }, [])

  // Fetch vacations overlapping with the selected date
  const fetchVacations = useCallback(async () => {
    try {
      const res = await fetch(`/api/vacations?date=${selectedDate}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setVacations(Array.isArray(data) ? data : [])
    } catch {
      // silently fail
    }
  }, [selectedDate])

  // On mount: auto-generate for today, then fetch
  useEffect(() => {
    const init = async () => {
      await generateDeliveries(selectedDate, true)
      await fetchDeliveries()
      fetchVacations()
    }
    init()
  }, [selectedDate])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  useEffect(() => {
    if (addDialogOpen) {
      fetchCustomers()
      fetchInventory()
    }
  }, [addDialogOpen, fetchCustomers, fetchInventory])

  // Re-fetch when filter changes (but not on date change, which is handled above)
  useEffect(() => {
    if (!loading) fetchDeliveries()
  }, [statusFilter, routeFilter])

  // Summary stats derived from all deliveries for the date
  const [allDateDeliveries, setAllDateDeliveries] = useState<Delivery[]>([])

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch(`/api/deliveries?date=${selectedDate}`)
        if (res.ok) {
          const data: Delivery[] = await res.json()
          setAllDateDeliveries(data)
        }
      } catch {
        // silent
      }
    }
    fetchAll()
  }, [selectedDate, deliveries])

  const summary = useMemo(() => {
    const total = allDateDeliveries.length
    const delivered = allDateDeliveries.filter((d) => d.status === 'Delivered').length
    const pending = allDateDeliveries.filter((d) => d.status === 'Pending').length
    const missed = allDateDeliveries.filter((d) => d.status === 'Missed').length
    const totalMilk = allDateDeliveries
      .filter((d) => d.productName.toLowerCase().includes('milk'))
      .reduce((sum, d) => sum + d.quantity, 0)
    const totalRevenue = allDateDeliveries
      .filter((d) => d.status === 'Delivered')
      .reduce((sum, d) => sum + d.quantity * d.pricePerUnit, 0)
    const extraCount = allDateDeliveries.filter((d) => d.isExtra).length
    return { total, delivered, pending, missed, totalMilk, totalRevenue, extraCount }
  }, [allDateDeliveries])

  // Group deliveries by route
  const groupedDeliveries = useMemo(() => {
    const groups: Record<string, Delivery[]> = {}
    for (const d of deliveries) {
      if (!groups[d.route]) groups[d.route] = []
      groups[d.route].push(d)
    }
    // Sort routes in the defined order
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const idxA = routes.findIndex((r) => r.value === a)
      const idxB = routes.findIndex((r) => r.value === b)
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
    })
    return sortedKeys.map((key) => ({
      route: key,
      label: getRouteLabel(key, routes),
      deliveries: groups[key],
    }))
  }, [deliveries, routes])

  // Update delivery status
  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    )
    setAllDateDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    )
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      toast.success(
        status === 'Delivered'
          ? 'Marked as delivered'
          : status === 'Missed'
            ? 'Marked as missed'
            : 'Status updated'
      )
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      )
      setAllDateDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      )
    } catch {
      toast.error('Failed to update delivery status')
      fetchDeliveries()
    } finally {
      setUpdatingId(null)
    }
  }

  // Mark all pending as delivered
  const markAllDelivered = async () => {
    const pendingDeliveries = allDateDeliveries.filter((d) => d.status === 'Pending')
    if (pendingDeliveries.length === 0) return

    toast.loading(`Marking ${pendingDeliveries.length} deliveries as delivered...`, { id: 'mark-all' })

    setDeliveries((prev) =>
      prev.map((d) => (d.status === 'Pending' ? { ...d, status: 'Delivered' } : d))
    )
    setAllDateDeliveries((prev) =>
      prev.map((d) => (d.status === 'Pending' ? { ...d, status: 'Delivered' } : d))
    )

    try {
      await Promise.all(
        pendingDeliveries.map((d) =>
          fetch(`/api/deliveries/${d.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Delivered' }),
          })
        )
      )
      toast.success(`All ${pendingDeliveries.length} deliveries marked as delivered`, { id: 'mark-all' })
      fetchDeliveries()
    } catch {
      toast.error('Failed to mark all as delivered', { id: 'mark-all' })
      fetchDeliveries()
    }
  }

  // Save notes
  const saveNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Failed')
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, notes } : d))
      )
      setAllDateDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, notes } : d))
      )
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    }
    setEditingNotesId(null)
  }

  // Add new delivery (regular or extra)
  const handleAddDelivery = async () => {
    if (!newDelivery.customerId) {
      toast.error('Please select a customer')
      return
    }
    setAddingDelivery(true)
    try {
      // Determine product info based on selection
      let itemName = 'Milk'
      let pricePerUnit = 0
      let itemId: string | null = null

      if (newDelivery.itemId) {
        const item = inventoryItems.find((i) => i.id === newDelivery.itemId)
        if (item) {
          itemName = item.name
          pricePerUnit = item.pricePerUnit
          itemId = item.id
        }
      } else {
        // Default to customer's milk
        const customer = customers.find((c) => c.id === newDelivery.customerId)
        if (customer) {
          itemName = `${customer.milkType || 'Milk'}`
          pricePerUnit = customer.pricePerLiter
        }
      }

      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newDelivery.customerId,
          date: newDelivery.date,
          quantity: newDelivery.quantity,
          status: 'Pending',
          route: newDelivery.route,
          notes: newDelivery.notes,
          itemId: itemId,
          isExtra: newDelivery.isExtra,
          pricePerUnit: pricePerUnit,
          productName: itemName,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(newDelivery.isExtra ? 'Extra delivery added' : 'Delivery added successfully')
      setAddDialogOpen(false)
      setNewDelivery({
        customerId: '',
        date: getTodayStr(),
        quantity: 1,
        route: 'Route A',
        notes: '',
        itemId: null,
        isExtra: false,
      })
      fetchDeliveries()
    } catch {
      toast.error('Failed to add delivery')
    } finally {
      setAddingDelivery(false)
    }
  }

  // Record extra sale for a specific customer
  const handleRecordExtra = async () => {
    if (!extraDelivery.customerId) {
      toast.error('No customer selected')
      return
    }
    if (!extraDelivery.itemId) {
      toast.error('Please select a product')
      return
    }
    setAddingExtra(true)
    try {
      const item = inventoryItems.find((i) => i.id === extraDelivery.itemId)
      if (!item) {
        toast.error('Product not found')
        return
      }

      // Determine route from customer's area
      const customer = customers.find((c) => c.id === extraDelivery.customerId)
      const route = customer
        ? routes.find((r) => r.label.toLowerCase().includes(customer.area.toLowerCase()))?.value || 'Route A'
        : 'Route A'

      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: extraDelivery.customerId,
          date: selectedDate,
          quantity: extraDelivery.quantity,
          status: 'Pending',
          route,
          notes: extraDelivery.notes,
          itemId: item.id,
          isExtra: true,
          pricePerUnit: item.pricePerUnit,
          productName: item.name,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Extra ${item.name} added for ${extraDelivery.customerName}`)
      setExtraDialogOpen(false)
      setExtraDelivery({
        customerId: '',
        customerName: '',
        itemId: '',
        quantity: 1,
        notes: '',
      })
      fetchDeliveries()
    } catch {
      toast.error('Failed to record extra delivery')
    } finally {
      setAddingExtra(false)
    }
  }

  // Open "Record Extra" dialog for a specific customer
  const openExtraDialog = (customerId: string, customerName: string) => {
    setExtraDelivery({
      customerId,
      customerName,
      itemId: '',
      quantity: 1,
      notes: '',
    })
    fetchInventory()
    setExtraDialogOpen(true)
  }

  // Auto-fill quantity & route when customer selected in add dialog
  const handleCustomerSelect = (customerId: string) => {
    setNewDelivery((prev) => ({ ...prev, customerId }))
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setNewDelivery((prev) => ({
        ...prev,
        customerId,
        quantity: customer.dailyQty || 1,
        route: customer.area
          ? routes.find((r) => r.label.toLowerCase().includes(customer.area.toLowerCase()))?.value || routes[0]?.value || 'Route A'
          : prev.route,
      }))
    }
  }

  // When product selected in add dialog, update quantity defaults
  const handleProductSelect = (itemId: string) => {
    if (!itemId) {
      // Default milk - use customer's daily qty
      const customer = customers.find((c) => c.id === newDelivery.customerId)
      setNewDelivery((prev) => ({
        ...prev,
        itemId: null,
        quantity: customer?.dailyQty || 1,
      }))
    } else {
      const item = inventoryItems.find((i) => i.id === itemId)
      setNewDelivery((prev) => ({
        ...prev,
        itemId,
        quantity: 1,
      }))
    }
  }

  const pendingCount = summary.pending

  // --- Shared Add Delivery Form ---
  const addDeliveryForm = (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Customer</Label>
        <Select
          value={newDelivery.customerId}
          onValueChange={handleCustomerSelect}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} - {c.area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Product</Label>
        <Select
          value={newDelivery.itemId || '__milk__'}
          onValueChange={(v) => handleProductSelect(v === '__milk__' ? '' : v)}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__milk__">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                Milk (Customer Plan)
              </span>
            </SelectItem>
            {inventoryItems.map((item) => {
              const color = getProductColor(item.name)
              return (
                <SelectItem key={item.id} value={item.id}>
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${color.dot}`} />
                    {item.name} - {formatPKR(item.pricePerUnit)}/{item.unit}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Extra Delivery</Label>
        <Button
          type="button"
          variant={newDelivery.isExtra ? 'default' : 'outline'}
          size="sm"
          className={newDelivery.isExtra ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
          onClick={() => setNewDelivery((prev) => ({ ...prev, isExtra: !prev.isExtra }))}
        >
          {newDelivery.isExtra ? 'Yes - Extra' : 'No - Regular'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date</Label>
          <Input
            type="date"
            value={newDelivery.date}
            onChange={(e) =>
              setNewDelivery((prev) => ({ ...prev, date: e.target.value }))
            }
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quantity</Label>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            value={newDelivery.quantity}
            onChange={(e) =>
              setNewDelivery((prev) => ({
                ...prev,
                quantity: parseFloat(e.target.value) || 0,
              }))
            }
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Route</Label>
        <Select
          value={newDelivery.route}
          onValueChange={(v) =>
            setNewDelivery((prev) => ({ ...prev, route: v }))
          }
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {routes.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          placeholder="Optional notes..."
          value={newDelivery.notes}
          onChange={(e) =>
            setNewDelivery((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
          className="min-h-[60px]"
        />
      </div>
    </div>
  )

  const addDeliveryButtons = (
    <>
      <Button
        variant="outline"
        onClick={() => setAddDialogOpen(false)}
        className="h-11 min-w-[80px]"
      >
        Cancel
      </Button>
      <Button
        className="bg-green-600 hover:bg-green-700 text-white h-11 min-w-[120px]"
        onClick={handleAddDelivery}
        disabled={addingDelivery}
      >
        {addingDelivery ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Delivery'
        )}
      </Button>
    </>
  )

  // --- Record Extra Delivery Form ---
  const recordExtraForm = (
    <div className="grid gap-4 py-2">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-100 dark:border-green-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">{extraDelivery.customerName}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Extra delivery for {selectedDate}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Product</Label>
        <Select
          value={extraDelivery.itemId}
          onValueChange={(v) => setExtraDelivery((prev) => ({ ...prev, itemId: v }))}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {inventoryItems.map((item) => {
              const color = getProductColor(item.name)
              return (
                <SelectItem key={item.id} value={item.id}>
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${color.dot}`} />
                    {item.name} - {formatPKR(item.pricePerUnit)}/{item.unit}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Quantity</Label>
        <Input
          type="number"
          step="0.5"
          min="0.5"
          value={extraDelivery.quantity}
          onChange={(e) =>
            setExtraDelivery((prev) => ({
              ...prev,
              quantity: parseFloat(e.target.value) || 0,
            }))
          }
          className="h-11"
        />
      </div>

      {extraDelivery.itemId && extraDelivery.quantity > 0 && (() => {
        const item = inventoryItems.find((i) => i.id === extraDelivery.itemId)
        if (!item) return null
        return (
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800">
            <span className="text-sm text-amber-700 dark:text-amber-300">Total Amount</span>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
              {formatPKR(extraDelivery.quantity * item.pricePerUnit)}
            </span>
          </div>
        )
      })()}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          placeholder="Optional notes..."
          value={extraDelivery.notes}
          onChange={(e) =>
            setExtraDelivery((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
          className="min-h-[60px]"
        />
      </div>
    </div>
  )

  const recordExtraButtons = (
    <>
      <Button
        variant="outline"
        onClick={() => setExtraDialogOpen(false)}
        className="h-11 min-w-[80px]"
      >
        Cancel
      </Button>
      <Button
        className="bg-amber-500 hover:bg-amber-600 text-white h-11 min-w-[120px] gap-2"
        onClick={handleRecordExtra}
        disabled={addingExtra || !extraDelivery.itemId}
      >
        {addingExtra ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <PackagePlus className="h-4 w-4" />
            Record Extra
          </>
        )}
      </Button>
    </>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
              <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Deliveries</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Track daily milk & product deliveries</p>
            </div>
          </div>
        </div>

        {/* Date + Actions row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 sm:w-44 h-11 sm:h-9 text-sm"
          />
          <Button
            variant="outline"
            className="h-11 sm:h-9 gap-2 shrink-0 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
            onClick={() => generateDeliveries(selectedDate)}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Generate</span>
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white h-11 sm:h-9 gap-2 shrink-0 px-4 sm:px-3"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Delivery</span>
          </Button>

          {/* Desktop Dialog */}
          {!isMobile && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Delivery</DialogTitle>
                  <DialogDescription>
                    Create a delivery entry for a customer
                  </DialogDescription>
                </DialogHeader>
                {addDeliveryForm}
                <DialogFooter>
                  {addDeliveryButtons}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Mobile Drawer (bottom sheet) */}
          {isMobile && (
            <Drawer open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DrawerContent className="max-h-[92vh]">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Add New Delivery</DrawerTitle>
                  <DrawerDescription>
                    Create a delivery entry for a customer
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 overflow-y-auto">
                  {addDeliveryForm}
                </div>
                <DrawerFooter>
                  {addDeliveryButtons}
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>

      {/* 2. Vacation Awareness Banner */}
      {generationResult && generationResult.skippedVacation > 0 && !vacationBannerDismissed && (
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {generationResult.skippedVacation} customer{generationResult.skippedVacation !== 1 ? 's' : ''} on vacation
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Deliveries were skipped for customers currently on vacation.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={() => setVacationBannerDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 3. Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 border-l-4 border-l-gray-400 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-gray-100 dark:bg-gray-800">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.total}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-green-50 dark:bg-green-950/50">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{summary.delivered}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary.pending}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-red-50 dark:bg-red-950/50">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.missed}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Missed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 border-l-4 border-l-emerald-500 shadow-sm col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              <Milk className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">{formatQuantity(summary.totalMilk)}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Total Milk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Extra count row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800">
          <span className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">Revenue:</span>
          <span className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-200">{formatPKR(summary.totalRevenue)}</span>
        </div>
        {summary.extraCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800">
            <PackagePlus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">
              {summary.extraCount} extra delivery{summary.extraCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* 4. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="w-full sm:w-52 h-11 sm:h-9 text-sm">
            <SelectValue placeholder="All Routes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            {routes.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-11 sm:h-9 text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pendingCount > 0 && (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white h-11 sm:h-9 gap-2 sm:ml-auto w-full sm:w-auto font-medium"
            onClick={markAllDelivered}
          >
            <PackageCheck className="h-4 w-4" />
            Mark All Delivered ({pendingCount})
          </Button>
        )}
      </div>

      {/* 5. Route-Grouped Delivery List */}
      {loading ? (
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="flex h-40 sm:h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading deliveries...</p>
            </div>
          </CardContent>
        </Card>
      ) : deliveries.length === 0 ? (
        <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="flex h-40 sm:h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Truck className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No deliveries found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {selectedDate === getTodayStr()
                    ? 'Generate deliveries or add one manually to get started.'
                    : 'No deliveries found for the selected date and filters.'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  className="h-11 gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  onClick={() => generateDeliveries(selectedDate)}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white h-11 gap-2"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Delivery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groupedDeliveries.map((group) => {
            // Group deliveries by customer within each route
            const customerGroups: Record<string, { customer: Delivery['customer']; customerId: string; items: Delivery[] }> = {}
            for (const d of group.deliveries) {
              if (!customerGroups[d.customerId]) {
                customerGroups[d.customerId] = {
                  customer: d.customer,
                  customerId: d.customerId,
                  items: [],
                }
              }
              customerGroups[d.customerId].items.push(d)
            }
            const customerEntries = Object.values(customerGroups)
            const routeDeliveredCount = group.deliveries.filter((d) => d.status === 'Delivered').length
            const routePendingCount = group.deliveries.filter((d) => d.status === 'Pending').length

            return (
              <Collapsible
                key={group.route}
                open={collapsedRoutes[group.route] !== false}
                onOpenChange={() => toggleRoute(group.route)}
              >
                <Card className="rounded-lg sm:rounded-xl border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Route header */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-3 flex items-center justify-between hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-950/50">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{group.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {routePendingCount > 0 && (
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 font-medium">
                            {routePendingCount} pending
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[11px] sm:text-xs font-medium px-2 py-0.5">
                          {group.deliveries.length} delivery{group.deliveries.length !== 1 ? 's' : ''}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${collapsedRoutes[group.route] === false ? '' : 'rotate-180'}`} />
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  {/* Delivery items grouped by customer */}
                  <CollapsibleContent>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {customerEntries.map(({ customer, customerId, items }) => (
                        <div key={customerId} className="px-3 sm:px-4 py-3 sm:py-3.5">
                          {/* Customer Header */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 text-xs font-bold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate block">
                                  {customer.name}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                                  {customer.area}{customer.phone ? ` · ${customer.phone}` : ''}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 sm:h-7 gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 shrink-0 px-2 sm:px-2.5"
                              onClick={() => openExtraDialog(customerId, customer.name)}
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Record Extra</span>
                            </Button>
                          </div>

                          {/* Product items for this customer */}
                          <div className="ml-9 sm:ml-10 space-y-1.5">
                            {items.map((delivery) => {
                              const productColor = getProductColor(delivery.productName)

                              return (
                                <div
                                  key={delivery.id}
                                  className="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                                >
                                  {/* Product color dot */}
                                  <div className={`mt-1 size-2.5 shrink-0 rounded-full ${productColor.dot}`} />

                                  {/* Product info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-xs sm:text-sm font-medium ${productColor.text}`}>
                                        {delivery.productName}
                                      </span>
                                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-md px-1.5 py-0.5 ${productColor.bg} ${productColor.text} border ${productColor.border}`}>
                                        {formatQuantity(delivery.quantity)}
                                      </span>
                                      {delivery.isExtra && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold">
                                          Extra
                                        </Badge>
                                      )}
                                      <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
                                        {formatPKR(delivery.quantity * delivery.pricePerUnit)}
                                      </span>
                                    </div>

                                    {/* Status + actions row */}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {getStatusBadge(delivery.status, isMobile)}

                                      {/* Inline notes */}
                                      {editingNotesId === delivery.id ? (
                                        <div className="flex items-center gap-1 flex-1">
                                          <Input
                                            value={notesValue}
                                            onChange={(e) => setNotesValue(e.target.value)}
                                            placeholder="Add notes..."
                                            className="h-7 text-xs flex-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveNotes(delivery.id, notesValue)
                                              if (e.key === 'Escape') setEditingNotesId(null)
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs px-2 shrink-0"
                                            onClick={() => saveNotes(delivery.id, notesValue)}
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                          onClick={() => {
                                            setEditingNotesId(delivery.id)
                                            setNotesValue(delivery.notes || '')
                                          }}
                                        >
                                          {delivery.notes || '+ note'}
                                        </button>
                                      )}
                                    </div>

                                    {/* Action buttons for pending */}
                                    {delivery.status === 'Pending' && (
                                      <div className="flex items-center gap-1.5 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 sm:h-7 flex-1 sm:flex-none sm:min-w-[100px] gap-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300 font-medium text-xs"
                                          onClick={() => updateStatus(delivery.id, 'Delivered')}
                                          disabled={updatingId === delivery.id}
                                        >
                                          {updatingId === delivery.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <CheckCircle className="h-3.5 w-3.5" />
                                          )}
                                          Delivered
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 sm:h-7 flex-1 sm:flex-none sm:min-w-[70px] gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 font-medium text-xs"
                                          onClick={() => updateStatus(delivery.id, 'Missed')}
                                          disabled={updatingId === delivery.id}
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                          Missed
                                        </Button>
                                      </div>
                                    )}

                                    {/* Retry for missed */}
                                    {delivery.status === 'Missed' && (
                                      <div className="flex items-center gap-1.5 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 sm:h-7 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950 font-medium text-xs"
                                          onClick={() => updateStatus(delivery.id, 'Pending')}
                                          disabled={updatingId === delivery.id}
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Retry
                                        </Button>
                                      </div>
                                    )}

                                    {/* Cancel for any active status */}
                                    {(delivery.status === 'Pending' || delivery.status === 'Missed') && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 sm:h-6 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 px-1 mt-0.5"
                                        onClick={() => updateStatus(delivery.id, 'Cancelled')}
                                        disabled={updatingId === delivery.id}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      {/* Customers on vacation in this route */}
                      {(() => {
                        const routeVacations = vacations.filter(v => {
                          const vacationRoute = areaRouteMap[v.customer.area] || 'Route A'
                          return vacationRoute === group.route
                        })
                        return routeVacations.length > 0 ? (
                          <div className="px-3 sm:px-4 py-2 bg-amber-50/50 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-800">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Umbrella className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">On Vacation</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {routeVacations.map((v) => (
                                <Badge key={v.id} variant="outline" className="text-[10px] bg-amber-50/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800 px-2 py-0.5">
                                  {v.customer.name} ({v.startDate} → {v.endDate})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      )}

      {/* Record Extra Delivery Dialog (Desktop) */}
      {!isMobile && (
        <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                  <PackagePlus className="h-4 w-4 text-amber-600" />
                </div>
                Record Extra Delivery
              </DialogTitle>
              <DialogDescription>
                Add an extra product delivery for this customer
              </DialogDescription>
            </DialogHeader>
            {recordExtraForm}
            <DialogFooter>
              {recordExtraButtons}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Record Extra Delivery Drawer (Mobile) */}
      {isMobile && (
        <Drawer open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-amber-600" />
                Record Extra Delivery
              </DrawerTitle>
              <DrawerDescription>
                Add an extra product delivery for this customer
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto">
              {recordExtraForm}
            </div>
            <DrawerFooter>
              {recordExtraButtons}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
