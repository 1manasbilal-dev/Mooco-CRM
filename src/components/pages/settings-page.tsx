'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Settings,
  Store,
  Truck,
  Clock,
  IndianRupee,
  Users,
  Bell,
  Database,
  User,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Phone,
  BadgeCheck,
  Milk,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────
interface SettingsMap {
  shopName: string
  shopPhone: string
  shopAddress: string
  shopEmail: string
  deliveryCharge: string
  morningCutoff: string
  eveningCutoff: string
  businessHours: string
  defaultMilkPrice: string
  currency: string
}

interface StaffMember {
  id: number
  name: string
  role: string
  phone: string
}

interface Area {
  id: string
  name: string
}

interface MilkType {
  id: string
  name: string
  pricePerLiter: number
}

interface DeliveryTime {
  id: string
  name: string
}

// ── Default Values ──────────────────────────────────────────────────────
const DEFAULT_SETTINGS: SettingsMap = {
  shopName: '',
  shopPhone: '',
  shopAddress: '',
  shopEmail: '',
  deliveryCharge: '50',
  morningCutoff: '07:00 AM',
  eveningCutoff: '06:00 PM',
  businessHours: '6:00 AM - 10:00 PM',
  defaultMilkPrice: '60',
  currency: 'PKR',
}

const SAMPLE_STAFF: StaffMember[] = [
  { id: 1, name: 'Ahmed Khan', role: 'Delivery Driver', phone: '0300-1234567' },
  { id: 2, name: 'Bilal Shah', role: 'Delivery Driver', phone: '0312-9876543' },
  { id: 3, name: 'Farhan Ali', role: 'Warehouse Staff', phone: '0321-5556789' },
]

// ── Component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  // ── State ───────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<SettingsMap>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Notifications (UI-only)
  const [notifications, setNotifications] = useState({
    dailyDeliverySummary: true,
    lowStockAlerts: true,
    paymentReminders: true,
    newLeadNotifications: true,
  })

  // Reset dialog
  const [resetOpen, setResetOpen] = useState(false)

  // ── Area Management State ─────────────────────────────────────────
  const [areas, setAreas] = useState<Area[]>([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [areaDialogOpen, setAreaDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaName, setAreaName] = useState('')
  const [areaSubmitting, setAreaSubmitting] = useState(false)

  // ── Milk Type Management State ────────────────────────────────────
  const [milkTypes, setMilkTypes] = useState<MilkType[]>([])
  const [milkTypesLoading, setMilkTypesLoading] = useState(false)
  const [milkTypeDialogOpen, setMilkTypeDialogOpen] = useState(false)
  const [editingMilkType, setEditingMilkType] = useState<MilkType | null>(null)
  const [milkTypeName, setMilkTypeName] = useState('')
  const [milkTypePrice, setMilkTypePrice] = useState('')
  const [milkTypeSubmitting, setMilkTypeSubmitting] = useState(false)

  // ── Delivery Time Management State ────────────────────────────────
  const [deliveryTimes, setDeliveryTimes] = useState<DeliveryTime[]>([])
  const [deliveryTimesLoading, setDeliveryTimesLoading] = useState(false)
  const [deliveryTimeDialogOpen, setDeliveryTimeDialogOpen] = useState(false)
  const [editingDeliveryTime, setEditingDeliveryTime] = useState<DeliveryTime | null>(null)
  const [deliveryTimeName, setDeliveryTimeName] = useState('')
  const [deliveryTimeSubmitting, setDeliveryTimeSubmitting] = useState(false)

  // ── Dirty check ─────────────────────────────────────────────────────
  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  // ── Fetch settings ──────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const merged: SettingsMap = { ...DEFAULT_SETTINGS }
      for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SettingsMap)[]) {
        if (data[key] !== undefined && data[key] !== null) {
          merged[key] = data[key]
        }
      }
      setSettings(merged)
      setSavedSettings(merged)
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch Areas ──────────────────────────────────────────────────
  const fetchAreas = useCallback(async () => {
    setAreasLoading(true)
    try {
      const res = await fetch('/api/areas')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAreas(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load areas')
    } finally {
      setAreasLoading(false)
    }
  }, [])

  // ── Fetch Milk Types ─────────────────────────────────────────────
  const fetchMilkTypes = useCallback(async () => {
    setMilkTypesLoading(true)
    try {
      const res = await fetch('/api/milk-types')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMilkTypes(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load milk types')
    } finally {
      setMilkTypesLoading(false)
    }
  }, [])

  // ── Fetch Delivery Times ─────────────────────────────────────────
  const fetchDeliveryTimes = useCallback(async () => {
    setDeliveryTimesLoading(true)
    try {
      const res = await fetch('/api/delivery-times')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDeliveryTimes(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load delivery times')
    } finally {
      setDeliveryTimesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchAreas()
    fetchMilkTypes()
    fetchDeliveryTimes()
  }, [fetchSettings, fetchAreas, fetchMilkTypes, fetchDeliveryTimes])

  // ── Area CRUD ────────────────────────────────────────────────────
  const openAddArea = () => {
    setEditingArea(null)
    setAreaName('')
    setAreaDialogOpen(true)
  }

  const openEditArea = (area: Area) => {
    setEditingArea(area)
    setAreaName(area.name)
    setAreaDialogOpen(true)
  }

  const handleAreaSubmit = async () => {
    if (!areaName.trim()) {
      toast.error('Area name is required')
      return
    }
    setAreaSubmitting(true)
    try {
      if (editingArea) {
        const res = await fetch(`/api/areas/${editingArea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: areaName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Area updated successfully')
      } else {
        const res = await fetch('/api/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: areaName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Area added successfully')
      }
      setAreaDialogOpen(false)
      fetchAreas()
    } catch {
      toast.error(editingArea ? 'Failed to update area' : 'Failed to add area')
    } finally {
      setAreaSubmitting(false)
    }
  }

  const handleDeleteArea = async (id: string) => {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Area deleted successfully')
      fetchAreas()
    } catch {
      toast.error('Failed to delete area')
    }
  }

  // ── Milk Type CRUD ───────────────────────────────────────────────
  const openAddMilkType = () => {
    setEditingMilkType(null)
    setMilkTypeName('')
    setMilkTypePrice('')
    setMilkTypeDialogOpen(true)
  }

  const openEditMilkType = (mt: MilkType) => {
    setEditingMilkType(mt)
    setMilkTypeName(mt.name)
    setMilkTypePrice(String(mt.pricePerLiter))
    setMilkTypeDialogOpen(true)
  }

  const handleMilkTypeSubmit = async () => {
    if (!milkTypeName.trim()) {
      toast.error('Milk type name is required')
      return
    }
    if (!milkTypePrice || isNaN(Number(milkTypePrice)) || Number(milkTypePrice) < 0) {
      toast.error('Valid price per liter is required')
      return
    }
    setMilkTypeSubmitting(true)
    try {
      if (editingMilkType) {
        const res = await fetch(`/api/milk-types/${editingMilkType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: milkTypeName.trim(),
            pricePerLiter: Number(milkTypePrice),
          }),
        })
        if (!res.ok) throw new Error()
        toast.success('Milk type updated successfully')
      } else {
        const res = await fetch('/api/milk-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: milkTypeName.trim(),
            pricePerLiter: Number(milkTypePrice),
          }),
        })
        if (!res.ok) throw new Error()
        toast.success('Milk type added successfully')
      }
      setMilkTypeDialogOpen(false)
      fetchMilkTypes()
    } catch {
      toast.error(editingMilkType ? 'Failed to update milk type' : 'Failed to add milk type')
    } finally {
      setMilkTypeSubmitting(false)
    }
  }

  const handleDeleteMilkType = async (id: string) => {
    try {
      const res = await fetch(`/api/milk-types/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Milk type deleted successfully')
      fetchMilkTypes()
    } catch {
      toast.error('Failed to delete milk type')
    }
  }

  // ── Delivery Time CRUD ───────────────────────────────────────────
  const openAddDeliveryTime = () => {
    setEditingDeliveryTime(null)
    setDeliveryTimeName('')
    setDeliveryTimeDialogOpen(true)
  }

  const openEditDeliveryTime = (dt: DeliveryTime) => {
    setEditingDeliveryTime(dt)
    setDeliveryTimeName(dt.name)
    setDeliveryTimeDialogOpen(true)
  }

  const handleDeliveryTimeSubmit = async () => {
    if (!deliveryTimeName.trim()) {
      toast.error('Delivery time name is required')
      return
    }
    setDeliveryTimeSubmitting(true)
    try {
      if (editingDeliveryTime) {
        const res = await fetch(`/api/delivery-times/${editingDeliveryTime.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: deliveryTimeName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Delivery time updated successfully')
      } else {
        const res = await fetch('/api/delivery-times', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: deliveryTimeName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Delivery time added successfully')
      }
      setDeliveryTimeDialogOpen(false)
      fetchDeliveryTimes()
    } catch {
      toast.error(editingDeliveryTime ? 'Failed to update delivery time' : 'Failed to add delivery time')
    } finally {
      setDeliveryTimeSubmitting(false)
    }
  }

  const handleDeleteDeliveryTime = async (id: string) => {
    try {
      const res = await fetch(`/api/delivery-times/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Delivery time deleted successfully')
      fetchDeliveryTimes()
    } catch {
      toast.error('Failed to delete delivery time')
    }
  }

  // ── Update field ────────────────────────────────────────────────────
  const updateField = (key: keyof SettingsMap, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // ── Save settings ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const merged: SettingsMap = { ...DEFAULT_SETTINGS }
      for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SettingsMap)[]) {
        if (data[key] !== undefined && data[key] !== null) {
          merged[key] = data[key]
        }
      }
      setSettings(merged)
      setSavedSettings(merged)
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading State ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <Settings className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure your dairy shop</p>
        </div>
      </div>

      {/* ── Settings Grid ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Card 1: Shop Information ─────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <Store className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Shop Information
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Basic details about your shop
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shopName" className="text-sm font-medium text-gray-700">
                Shop Name
              </Label>
              <Input
                id="shopName"
                placeholder="Enter shop name"
                value={settings.shopName}
                onChange={(e) => updateField('shopName', e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shopPhone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="shopPhone"
                placeholder="0300-1234567"
                value={settings.shopPhone}
                onChange={(e) => updateField('shopPhone', e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shopAddress" className="text-sm font-medium text-gray-700">
                Address
              </Label>
              <Textarea
                id="shopAddress"
                placeholder="Enter shop address"
                value={settings.shopAddress}
                onChange={(e) => updateField('shopAddress', e.target.value)}
                className="rounded-lg border-gray-200 min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shopEmail" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="shopEmail"
                type="email"
                placeholder="shop@example.com"
                value={settings.shopEmail}
                onChange={(e) => updateField('shopEmail', e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Delivery Settings ────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Delivery Settings
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Configure delivery charges and cutoff times
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="deliveryCharge" className="text-sm font-medium text-gray-700">
                Delivery Charge (PKR)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₨
                </span>
                <Input
                  id="deliveryCharge"
                  type="number"
                  placeholder="50"
                  value={settings.deliveryCharge}
                  onChange={(e) => updateField('deliveryCharge', e.target.value)}
                  className="rounded-lg border-gray-200 pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="morningCutoff" className="text-sm font-medium text-gray-700">
                Morning Delivery Cutoff
              </Label>
              <Input
                id="morningCutoff"
                placeholder="07:00 AM"
                value={settings.morningCutoff}
                onChange={(e) => updateField('morningCutoff', e.target.value)}
                className="rounded-lg border-gray-200"
              />
              <p className="text-[11px] text-gray-400">Orders after this time go to evening delivery</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eveningCutoff" className="text-sm font-medium text-gray-700">
                Evening Delivery Cutoff
              </Label>
              <Input
                id="eveningCutoff"
                placeholder="06:00 PM"
                value={settings.eveningCutoff}
                onChange={(e) => updateField('eveningCutoff', e.target.value)}
                className="rounded-lg border-gray-200"
              />
              <p className="text-[11px] text-gray-400">Orders after this go to next day delivery</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Business Hours ───────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Business Hours
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Your shop operating hours
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessHours" className="text-sm font-medium text-gray-700">
                Operating Hours
              </Label>
              <Input
                id="businessHours"
                placeholder="6:00 AM - 10:00 PM"
                value={settings.businessHours}
                onChange={(e) => updateField('businessHours', e.target.value)}
                className="rounded-lg border-gray-200"
              />
              <p className="text-[11px] text-gray-400">Format: 6:00 AM - 10:00 PM</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 4: Pricing ──────────────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Pricing
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Default milk pricing and currency
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="defaultMilkPrice" className="text-sm font-medium text-gray-700">
                Default Milk Price per Liter (PKR)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₨
                </span>
                <Input
                  id="defaultMilkPrice"
                  type="number"
                  placeholder="60"
                  value={settings.defaultMilkPrice}
                  onChange={(e) => updateField('defaultMilkPrice', e.target.value)}
                  className="rounded-lg border-gray-200 pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Currency
              </Label>
              <Input
                id="currency"
                placeholder="PKR"
                value={settings.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Card 5: Staff Management (UI Only) ───────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Staff Management
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Manage your delivery and warehouse staff
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Feature coming soon')}
                className="h-8 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Plus className="h-3 w-3" />
                Add Staff
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SAMPLE_STAFF.map((staff, index) => (
                <div key={staff.id}>
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 shrink-0">
                        <span className="text-xs font-semibold text-purple-700">
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {staff.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <BadgeCheck className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{staff.role}</span>
                          <span className="text-gray-300">·</span>
                          <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{staff.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info('Feature coming soon')}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info('Feature coming soon')}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {index < SAMPLE_STAFF.length - 1 && <Separator className="my-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Card 6: Notifications (UI Only) ──────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Bell className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Notifications
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Configure your notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Daily delivery summary</p>
                <p className="text-xs text-gray-500">Get a summary of deliveries each day</p>
              </div>
              <Switch
                checked={notifications.dailyDeliverySummary}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, dailyDeliverySummary: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Low stock alerts</p>
                <p className="text-xs text-gray-500">Notify when inventory is running low</p>
              </div>
              <Switch
                checked={notifications.lowStockAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, lowStockAlerts: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment reminders</p>
                <p className="text-xs text-gray-500">Remind customers about pending payments</p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, paymentReminders: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New lead notifications</p>
                <p className="text-xs text-gray-500">Get notified when a new lead is added</p>
              </div>
              <Switch
                checked={notifications.newLeadNotifications}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, newLeadNotifications: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Card 7: Area Management ───────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                  <MapPin className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Area Management
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Manage delivery areas
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddArea}
                className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Plus className="h-3 w-3" />
                Add Area
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {areasLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
              </div>
            ) : areas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <MapPin className="h-8 w-8 mb-2" />
                <p className="text-sm">No areas added yet</p>
                <p className="text-xs">Click &quot;Add Area&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-rose-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {area.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditArea(area)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArea(area.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Card 8: Milk Type Management ──────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                  <Milk className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Milk Type Management
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Manage milk types and pricing
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddMilkType}
                className="h-8 text-xs border-sky-200 text-sky-600 hover:bg-sky-50"
              >
                <Plus className="h-3 w-3" />
                Add Type
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {milkTypesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              </div>
            ) : milkTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Milk className="h-8 w-8 mb-2" />
                <p className="text-sm">No milk types added yet</p>
                <p className="text-xs">Click &quot;Add Type&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {milkTypes.map((mt) => (
                  <div
                    key={mt.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 shrink-0">
                        <Milk className="h-3.5 w-3.5 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {mt.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₨ {mt.pricePerLiter.toLocaleString()} / liter
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditMilkType(mt)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMilkType(mt.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Card 9: Delivery Time Management ──────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                  <Clock className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Delivery Time Management
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Manage delivery time slots
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddDeliveryTime}
                className="h-8 text-xs border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                <Plus className="h-3 w-3" />
                Add Time
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deliveryTimesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              </div>
            ) : deliveryTimes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">No delivery times added yet</p>
                <p className="text-xs">Click &quot;Add Time&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {deliveryTimes.map((dt) => (
                  <div
                    key={dt.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dt.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDeliveryTime(dt)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeliveryTime(dt.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Card 10: Data Management ──────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
                <Database className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Data Management
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Export, backup, and manage your data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => toast.success('Export started')}
                className="h-10 justify-start rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2 text-gray-500" />
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success('Backup created')}
                className="h-10 justify-start rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2 text-gray-500" />
                Backup
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.info('Select backup file')}
                className="h-10 justify-start rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 mr-2 text-gray-500" />
                Restore
              </Button>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-semibold text-red-700">Danger Zone</p>
              </div>
              <p className="text-xs text-red-600 mb-3">
                Resetting all data will permanently delete all your customers, deliveries, payments, and settings. This action cannot be undone.
              </p>
              <Button
                variant="outline"
                onClick={() => setResetOpen(true)}
                className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Reset All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 11: Account ──────────────────────────────────────── */}
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Account
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Your profile and account settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 shrink-0">
                <Milk className="h-6 w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {settings.shopName || 'DairyFlow Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {settings.shopEmail || 'admin@dairyflow.com'}
                </p>
              </div>
            </div>
            <Separator />
            <Button
              variant="outline"
              onClick={() => toast.success('Logged out')}
              className="w-full h-10 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Sticky Save Button ──────────────────────────────────────── */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-3 z-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm text-gray-500">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSettings(savedSettings)
                }}
                className="h-9 rounded-lg border-gray-200"
                disabled={saving}
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset All Data Confirmation ─────────────────────────────── */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Reset All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your customers, deliveries, payments, leads, inventory, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const res = await fetch('/api/reset', { method: 'POST' })
                  if (!res.ok) throw new Error()
                  toast.success('All data has been reset successfully')
                  setResetOpen(false)
                  fetchSettings()
                } catch {
                  toast.error('Failed to reset data')
                }
              }}
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Area Add/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-600" />
              {editingArea ? 'Edit Area' : 'Add Area'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Area Name</Label>
              <Input
                placeholder="Enter area name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="rounded-lg border-gray-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAreaSubmit()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAreaDialogOpen(false)}
              className="rounded-lg"
              disabled={areaSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAreaSubmit}
              disabled={areaSubmitting}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white min-w-[100px]"
            >
              {areaSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingArea ? (
                'Update'
              ) : (
                'Add Area'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Milk Type Add/Edit Dialog ────────────────────────────────── */}
      <Dialog open={milkTypeDialogOpen} onOpenChange={setMilkTypeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-sky-600" />
              {editingMilkType ? 'Edit Milk Type' : 'Add Milk Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Milk Type Name</Label>
              <Input
                placeholder="e.g. Fresh, Buffalo, Camel"
                value={milkTypeName}
                onChange={(e) => setMilkTypeName(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Price per Liter (PKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₨
                </span>
                <Input
                  type="number"
                  placeholder="60"
                  value={milkTypePrice}
                  onChange={(e) => setMilkTypePrice(e.target.value)}
                  className="rounded-lg border-gray-200 pl-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMilkTypeSubmit()
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMilkTypeDialogOpen(false)}
              className="rounded-lg"
              disabled={milkTypeSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMilkTypeSubmit}
              disabled={milkTypeSubmitting}
              className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white min-w-[100px]"
            >
              {milkTypeSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingMilkType ? (
                'Update'
              ) : (
                'Add Type'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delivery Time Add/Edit Dialog ────────────────────────────── */}
      <Dialog open={deliveryTimeDialogOpen} onOpenChange={setDeliveryTimeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              {editingDeliveryTime ? 'Edit Delivery Time' : 'Add Delivery Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Delivery Time</Label>
              <Input
                placeholder="e.g. Morning 6-9 AM"
                value={deliveryTimeName}
                onChange={(e) => setDeliveryTimeName(e.target.value)}
                className="rounded-lg border-gray-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDeliveryTimeSubmit()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeliveryTimeDialogOpen(false)}
              className="rounded-lg"
              disabled={deliveryTimeSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeliveryTimeSubmit}
              disabled={deliveryTimeSubmitting}
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white min-w-[100px]"
            >
              {deliveryTimeSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingDeliveryTime ? (
                'Update'
              ) : (
                'Add Time'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
