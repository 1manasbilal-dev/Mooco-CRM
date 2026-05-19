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
  DialogTrigger,
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
  route?: string
}

interface Delivery {
  id: string
  customerId: string
  date: string
  quantity: number
  status: string
  notes: string
  route: string
  createdAt: string
  updatedAt: string
  customer: {
    name: string
    area: string
    phone: string
    milkType?: string
  }
}

interface TodaySummary {
  date: string
  total: number
  delivered: number
  pending: number
  missed: number
  deliveries: Delivery[]
}

// --- Constants ---
const ROUTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const STATUSES = ['All', 'Pending', 'Delivered', 'Missed', 'Cancelled']

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatQuantity(qty: number): string {
  return qty % 1 === 0 ? `${qty}L` : `${qty}L`
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
        <Badge className={`${sizeClasses} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-medium`}>
          <Clock className="size-3 mr-1 shrink-0" />
          Pending
        </Badge>
      )
    case 'Delivered':
      return (
        <Badge className={`${sizeClasses} bg-green-50 text-green-700 border-green-200 hover:bg-green-50 font-medium`}>
          <CheckCircle className="size-3 mr-1 shrink-0" />
          Delivered
        </Badge>
      )
    case 'Missed':
      return (
        <Badge className={`${sizeClasses} bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-medium`}>
          <XCircle className="size-3 mr-1 shrink-0" />
          Missed
        </Badge>
      )
    case 'Cancelled':
      return (
        <Badge className={`${sizeClasses} bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50 font-medium`}>
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

  // Collapsible route groups state
  const [collapsedRoutes, setCollapsedRoutes] = useState<Record<string, boolean>>({})

  const toggleRoute = (route: string) => {
    setCollapsedRoutes((prev) => ({ ...prev, [route]: !prev[route] }))
  }

  // Derived routes from dynamic areas
  const routes = useMemo(() => buildRoutes(areas), [areas])

  // Add delivery dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newDelivery, setNewDelivery] = useState({
    customerId: '',
    date: getTodayStr(),
    quantity: 1,
    route: 'Route A',
    notes: '',
  })
  const [addingDelivery, setAddingDelivery] = useState(false)

  // Editing notes
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

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

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  useEffect(() => {
    if (addDialogOpen) {
      fetchCustomers()
    }
  }, [addDialogOpen, fetchCustomers])

  // Summary stats derived from current deliveries (unfiltered by route/status for counts)
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
  }, [selectedDate, deliveries]) // re-derive when deliveries change

  const summary = useMemo(() => {
    const total = allDateDeliveries.length
    const delivered = allDateDeliveries.filter((d) => d.status === 'Delivered').length
    const pending = allDateDeliveries.filter((d) => d.status === 'Pending').length
    const missed = allDateDeliveries.filter((d) => d.status === 'Missed').length
    const totalMilk = allDateDeliveries.reduce((sum, d) => sum + d.quantity, 0)
    return { total, delivered, pending, missed, totalMilk }
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
    // Optimistic update
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
          ? `Marked as delivered`
          : status === 'Missed'
            ? `Marked as missed`
            : `Status updated`
      )
      // Update with server response
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      )
      setAllDateDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      )
    } catch {
      // Revert optimistic update
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

    // Optimistic
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

  // Add new delivery
  const handleAddDelivery = async () => {
    if (!newDelivery.customerId) {
      toast.error('Please select a customer')
      return
    }
    setAddingDelivery(true)
    try {
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
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Delivery added successfully')
      setAddDialogOpen(false)
      setNewDelivery({
        customerId: '',
        date: getTodayStr(),
        quantity: 1,
        route: 'Route A',
        notes: '',
      })
      fetchDeliveries()
    } catch {
      toast.error('Failed to add delivery')
    } finally {
      setAddingDelivery(false)
    }
  }

  // Auto-fill quantity & route when customer selected
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

  const pendingCount = summary.pending

  // Shared add delivery form (used in both Dialog and Drawer)
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
          <Label className="text-sm font-medium">Quantity (L)</Label>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Page Header - Compact on mobile */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-green-100">
              <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Deliveries</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Track daily milk deliveries</p>
            </div>
          </div>
        </div>

        {/* Date + Add button row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 sm:w-44 h-11 sm:h-9 text-sm"
          />
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
                    Create a new delivery entry for a customer
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
                    Create a new delivery entry for a customer
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

      {/* 2. Summary Stats Row - 2 per row on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="rounded-lg sm:rounded-xl border-gray-200 border-l-4 border-l-gray-400 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-gray-100">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Total Deliveries</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-green-50">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{summary.delivered}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary.pending}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg sm:rounded-xl border-gray-200 border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-red-50">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.missed}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Missed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total milk banner */}
      <div className="flex items-center gap-2 px-1">
        <Milk className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-xs sm:text-sm text-gray-600">
          Total milk for <span className="font-semibold">{selectedDate}</span>:{' '}
          <span className="font-bold text-green-700">{formatQuantity(summary.totalMilk)}</span>
        </span>
      </div>

      {/* 3. Filter Bar - Stack vertically on mobile, full-width selects */}
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

      {/* 4. Route-Grouped Delivery List */}
      {loading ? (
        <Card className="rounded-lg sm:rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-40 sm:h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-500">Loading deliveries...</p>
            </div>
          </CardContent>
        </Card>
      ) : deliveries.length === 0 ? (
        <Card className="rounded-lg sm:rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-40 sm:h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Truck className="h-10 w-10 text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-500">No deliveries found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedDate === getTodayStr()
                    ? 'No deliveries scheduled for today. Add one to get started.'
                    : 'No deliveries found for the selected date and filters.'}
                </p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white h-11 gap-2 mt-1"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Delivery
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groupedDeliveries.map((group) => (
            <Collapsible
              key={group.route}
              open={collapsedRoutes[group.route] !== false}
              onOpenChange={() => toggleRoute(group.route)}
            >
              <Card className="rounded-lg sm:rounded-xl border-gray-200 shadow-sm overflow-hidden">
                {/* Route header - collapsible trigger */}
                <CollapsibleTrigger asChild>
                  <button className="w-full bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-3 flex items-center justify-between hover:bg-gray-100/80 transition-colors active:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-green-100">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm sm:text-base">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] sm:text-xs font-medium px-2 py-0.5">
                        {group.deliveries.length} delivery{group.deliveries.length !== 1 ? 's' : ''}
                      </Badge>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${collapsedRoutes[group.route] === false ? '' : 'rotate-180'}`} />
                    </div>
                  </button>
                </CollapsibleTrigger>

                {/* Delivery items */}
                <CollapsibleContent>
                  <div className="divide-y divide-gray-100">
                    {group.deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col gap-2 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Row 1: Name + Quantity + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {delivery.customer.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-green-700 bg-green-50 rounded-md px-1.5 sm:px-2 py-0.5 shrink-0 border border-green-100">
                              {formatQuantity(delivery.quantity)}
                            </span>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(delivery.status, isMobile)}
                          </div>
                        </div>

                        {/* Row 2: Meta info */}
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400">
                          <span>{delivery.customer.milkType || 'Full Cream'}</span>
                          {delivery.customer.area && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span>{delivery.customer.area}</span>
                            </>
                          )}
                        </div>

                        {/* Row 3: Notes (inline edit) */}
                        {editingNotesId === delivery.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Add notes..."
                              className="h-9 text-xs flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveNotes(delivery.id, notesValue)
                                if (e.key === 'Escape') setEditingNotesId(null)
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-xs px-3 shrink-0"
                              onClick={() => saveNotes(delivery.id, notesValue)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="text-[11px] sm:text-xs text-gray-400 hover:text-gray-600 cursor-pointer min-h-[28px] flex items-center"
                            onClick={() => {
                              setEditingNotesId(delivery.id)
                              setNotesValue(delivery.notes || '')
                            }}
                          >
                            {delivery.notes || '+ Add notes'}
                          </button>
                        )}

                        {/* Row 4: Action buttons - full-width on mobile, compact on desktop */}
                        {delivery.status === 'Pending' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 sm:h-9 flex-1 sm:flex-none sm:min-w-[120px] gap-1.5 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 font-medium text-sm"
                              onClick={() => updateStatus(delivery.id, 'Delivered')}
                              disabled={updatingId === delivery.id}
                            >
                              {updatingId === delivery.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span className="sm:hidden">Delivered</span>
                              <span className="hidden sm:inline">Mark Delivered</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 sm:h-9 flex-1 sm:flex-none sm:min-w-[90px] gap-1.5 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium text-sm"
                              onClick={() => updateStatus(delivery.id, 'Missed')}
                              disabled={updatingId === delivery.id}
                            >
                              <XCircle className="h-4 w-4" />
                              Missed
                            </Button>
                          </div>
                        )}
                        {delivery.status === 'Delivered' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-xs text-green-600 font-medium">Delivered</span>
                          </div>
                        )}
                        {delivery.status === 'Missed' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
                              <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <span className="text-xs text-red-500 font-medium">Missed</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 sm:h-9 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium text-xs ml-auto"
                              onClick={() => updateStatus(delivery.id, 'Pending')}
                              disabled={updatingId === delivery.id}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Retry
                            </Button>
                          </div>
                        )}
                        {delivery.status === 'Cancelled' && (
                          <div className="flex items-center mt-0.5">
                            <span className="text-xs text-gray-400">Cancelled</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
            </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
