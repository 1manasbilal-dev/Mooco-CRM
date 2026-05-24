'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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
  Save,
  X,
  ChevronRight,
  Package,
  UserPlus,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

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

interface Category {
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

const SAMPLE_STAFF = [
  { id: 1, name: 'Ahmed Khan', role: 'Delivery Driver', phone: '0300-1234567' },
  { id: 2, name: 'Bilal Shah', role: 'Delivery Driver', phone: '0312-9876543' },
  { id: 3, name: 'Farhan Ali', role: 'Warehouse Staff', phone: '0321-5556789' },
]

// ── Tab Definitions ─────────────────────────────────────────────────────
type SettingsTab = 'general' | 'delivery' | 'products' | 'staff' | 'notifications' | 'data'

interface TabDef {
  id: SettingsTab
  label: string
  mobileLabel: string
  icon: React.ElementType
  color: string
  bgLight: string
  description: string
  count?: number
}

const SETTINGS_TABS: TabDef[] = [
  { id: 'general', label: 'General', mobileLabel: 'General', icon: Store, color: 'text-green-600', bgLight: 'bg-green-100', description: 'Shop info, hours & account' },
  { id: 'delivery', label: 'Delivery', mobileLabel: 'Delivery', icon: Truck, color: 'text-amber-600', bgLight: 'bg-amber-100', description: 'Routes, areas & schedules' },
  { id: 'products', label: 'Products & Pricing', mobileLabel: 'Products', icon: Milk, color: 'text-sky-600', bgLight: 'bg-sky-100', description: 'Milk types, categories & pricing' },
  { id: 'staff', label: 'Staff', mobileLabel: 'Staff', icon: Users, color: 'text-purple-600', bgLight: 'bg-purple-100', description: 'Manage team members' },
  { id: 'notifications', label: 'Notifications', mobileLabel: 'Alerts', icon: Bell, color: 'text-orange-600', bgLight: 'bg-orange-100', description: 'Alert preferences' },
  { id: 'data', label: 'Data & Backup', mobileLabel: 'Data', icon: Database, color: 'text-cyan-600', bgLight: 'bg-cyan-100', description: 'Export, backup & reset' },
]

// ── Theme Toggle Sub-Component ────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, []) // eslint-disable-line react-hooks/set-state-in-effect

  if (!mounted) return <div className="h-16" />

  const options = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Classic light theme' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match your device' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon
        const isActive = theme === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={"flex flex-col items-center gap-2 rounded-xl p-3 md:p-4 border-2 transition-all duration-200 cursor-pointer " + (isActive ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600")}
          >
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl transition-all " + (isActive ? "bg-violet-100 dark:bg-violet-900" : "bg-gray-100 dark:bg-gray-800")}>
              <Icon className={"h-5 w-5 " + (isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500")} />
            </div>
            <span className={"text-sm font-semibold " + (isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300")}>{opt.label}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight hidden sm:block">{opt.desc}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const isMobile = useIsMobile()

  // ── Active Tab ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // ── Settings State ────────────────────────────────────────────────
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<SettingsMap>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

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

  // ── Category Management State ─────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categorySubmitting, setCategorySubmitting] = useState(false)

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

  // ── Fetch Categories ──────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchAreas()
    fetchMilkTypes()
    fetchDeliveryTimes()
    fetchCategories()
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

  // ── Category CRUD ──────────────────────────────────────────────────
  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryDialogOpen(true)
  }

  const handleCategorySubmit = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required')
      return
    }
    setCategorySubmitting(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Category updated successfully')
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName.trim() }),
        })
        if (!res.ok) throw new Error()
        toast.success('Category added successfully')
      }
      setCategoryDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to add category')
    } finally {
      setCategorySubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
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

  // ── Handle Reset ────────────────────────────────────────────────────
  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('All data has been reset successfully')
      setResetOpen(false)
      await Promise.all([fetchSettings(), fetchAreas(), fetchMilkTypes(), fetchDeliveryTimes(), fetchCategories()])
    } catch {
      toast.error('Failed to reset data')
    } finally {
      setResetting(false)
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

  // ── Tab Content Renderers ──────────────────────────────────────────

  const renderGeneralTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Shop Info */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-green-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-green-100 shadow-sm">
              <Store className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Shop Information</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Basic details about your dairy shop</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-4 md:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shopName" className="text-xs md:text-sm font-medium text-gray-700">Shop Name</Label>
              <Input id="shopName" placeholder="Enter shop name" value={settings.shopName} onChange={(e) => updateField('shopName', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shopPhone" className="text-xs md:text-sm font-medium text-gray-700">Phone Number</Label>
              <Input id="shopPhone" placeholder="0300-1234567" value={settings.shopPhone} onChange={(e) => updateField('shopPhone', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopAddress" className="text-xs md:text-sm font-medium text-gray-700">Address</Label>
            <Textarea id="shopAddress" placeholder="Enter shop address" value={settings.shopAddress} onChange={(e) => updateField('shopAddress', e.target.value)} className="rounded-lg border-gray-200 min-h-[72px] md:min-h-[80px] resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopEmail" className="text-xs md:text-sm font-medium text-gray-700">Email</Label>
            <Input id="shopEmail" type="email" placeholder="shop@example.com" value={settings.shopEmail} onChange={(e) => updateField('shopEmail', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Appearance / Theme */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-violet-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-violet-100 shadow-sm">
              <Sun className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Appearance</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Choose light or dark theme</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Business Hours & Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-amber-50/50 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-amber-100 shadow-sm">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Business Hours</CardTitle>
                <CardDescription className="text-[11px] md:text-xs text-gray-500">Shop operating schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="businessHours" className="text-xs md:text-sm font-medium text-gray-700">Operating Hours</Label>
              <Input id="businessHours" placeholder="6:00 AM - 10:00 PM" value={settings.businessHours} onChange={(e) => updateField('businessHours', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
              <p className="text-[10px] md:text-[11px] text-gray-400">Format: 6:00 AM - 10:00 PM</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-emerald-50/50 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-emerald-100 shadow-sm">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Default Pricing</CardTitle>
                <CardDescription className="text-[11px] md:text-xs text-gray-500">Base milk price & currency</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="defaultMilkPrice" className="text-xs md:text-sm font-medium text-gray-700">Default Milk Price / Liter (PKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₨</span>
                <Input id="defaultMilkPrice" type="number" placeholder="60" value={settings.defaultMilkPrice} onChange={(e) => updateField('defaultMilkPrice', e.target.value)} className="rounded-lg border-gray-200 pl-8 h-10 md:h-auto" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs md:text-sm font-medium text-gray-700">Currency</Label>
              <Input id="currency" placeholder="PKR" value={settings.currency} onChange={(e) => updateField('currency', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-gray-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-gray-100 shadow-sm">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Account</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Your profile & account settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6 pb-4 md:pb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shrink-0 shadow-md">
              <Milk className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{settings.shopName || 'DairyFlow Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{settings.shopEmail || 'admin@dairyflow.com'}</p>
            </div>
          </div>
          <Separator />
          <Button variant="outline" onClick={() => toast.success('Logged out')} className="w-full h-11 md:h-10 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 min-h-[44px]">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderDeliveryTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Delivery Settings */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-amber-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-amber-100 shadow-sm">
              <Truck className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Delivery Configuration</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Charges & cutoff times</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-4 md:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="deliveryCharge" className="text-xs md:text-sm font-medium text-gray-700">Delivery Charge (PKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₨</span>
                <Input id="deliveryCharge" type="number" placeholder="50" value={settings.deliveryCharge} onChange={(e) => updateField('deliveryCharge', e.target.value)} className="rounded-lg border-gray-200 pl-8 h-10 md:h-auto" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="morningCutoff" className="text-xs md:text-sm font-medium text-gray-700">Morning Cutoff</Label>
              <Input id="morningCutoff" placeholder="07:00 AM" value={settings.morningCutoff} onChange={(e) => updateField('morningCutoff', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
              <p className="text-[10px] md:text-[11px] text-gray-400">After this → evening delivery</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eveningCutoff" className="text-xs md:text-sm font-medium text-gray-700">Evening Cutoff</Label>
              <Input id="eveningCutoff" placeholder="06:00 PM" value={settings.eveningCutoff} onChange={(e) => updateField('eveningCutoff', e.target.value)} className="rounded-lg border-gray-200 h-10 md:h-auto" />
              <p className="text-[10px] md:text-[11px] text-gray-400">After this → next day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Areas & Delivery Times side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Areas */}
        <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-rose-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-rose-100 shadow-sm">
                  <MapPin className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Delivery Areas</CardTitle>
                  <CardDescription className="text-[11px] md:text-xs text-gray-500">{areas.length} area{areas.length !== 1 ? 's' : ''} configured</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openAddArea} className="h-8 md:h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 min-w-[44px] md:min-w-0">
                <Plus className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline">Add Area</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            {areasLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-rose-500" /></div>
            ) : areas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <MapPin className="h-8 w-8 mb-2" />
                <p className="text-sm">No areas added yet</p>
                <p className="text-xs">Tap &quot;+&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2 max-h-72 md:max-h-80 overflow-y-auto">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 md:p-3 hover:bg-gray-50 transition-colors min-h-[44px]">
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-rose-100 shrink-0">
                        <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-rose-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditArea(area)} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteArea(area.id)} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Times */}
        <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-teal-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-teal-100 shadow-sm">
                  <Clock className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Delivery Times</CardTitle>
                  <CardDescription className="text-[11px] md:text-xs text-gray-500">{deliveryTimes.length} slot{deliveryTimes.length !== 1 ? 's' : ''} configured</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openAddDeliveryTime} className="h-8 md:h-9 text-xs border-teal-200 text-teal-600 hover:bg-teal-50 min-w-[44px] md:min-w-0">
                <Plus className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline">Add Time</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            {deliveryTimesLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-teal-500" /></div>
            ) : deliveryTimes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">No delivery times added yet</p>
                <p className="text-xs">Tap &quot;+&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2 max-h-72 md:max-h-80 overflow-y-auto">
                {deliveryTimes.map((dt) => (
                  <div key={dt.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 md:p-3 hover:bg-gray-50 transition-colors min-h-[44px]">
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-teal-100 shrink-0">
                        <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-teal-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{dt.name}</p>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditDeliveryTime(dt)} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDeliveryTime(dt.id)} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderProductsTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Milk Types - Full Width */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-sky-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-sky-100 shadow-sm">
                <Milk className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Milk Types & Pricing</CardTitle>
                <CardDescription className="text-[11px] md:text-xs text-gray-500">{milkTypes.length} type{milkTypes.length !== 1 ? 's' : ''} · Manage products and their rates</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openAddMilkType} className="h-8 md:h-9 text-xs border-sky-200 text-sky-600 hover:bg-sky-50 min-w-[44px] md:min-w-0">
              <Plus className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Add Type</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          {milkTypesLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-sky-500" /></div>
          ) : milkTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 mb-3">
                <Milk className="h-8 w-8 text-sky-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No milk types added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first milk type to get started</p>
              <Button variant="outline" size="sm" onClick={openAddMilkType} className="mt-4 h-9 text-xs border-sky-200 text-sky-600 hover:bg-sky-50">
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Milk Type
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {milkTypes.map((mt) => (
                <div key={mt.id} className="group relative flex flex-col rounded-xl border border-gray-100 p-4 hover:border-sky-200 hover:bg-sky-50/30 transition-all min-h-[100px]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 shrink-0">
                      <Milk className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => openEditMilkType(mt)} className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMilkType(mt.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{mt.name}</p>
                  <p className="text-lg font-bold text-sky-600 mt-1">₨ {mt.pricePerLiter.toLocaleString()}<span className="text-xs font-normal text-gray-400">/liter</span></p>
                  {/* Mobile edit/delete always visible */}
                  <div className="flex items-center gap-1 mt-3 sm:hidden">
                    <Button variant="outline" size="sm" onClick={() => openEditMilkType(mt)} className="h-8 flex-1 text-xs border-gray-200">
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteMilkType(mt.id)} className="h-8 flex-1 text-xs border-red-200 text-red-600">
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories - Full Width */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-violet-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-violet-100 shadow-sm">
                <Package className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Categories</CardTitle>
                <CardDescription className="text-[11px] md:text-xs text-gray-500">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · Organize your products</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openAddCategory} className="h-8 md:h-9 text-xs border-violet-200 text-violet-600 hover:bg-violet-50 min-w-[44px] md:min-w-0">
              <Plus className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Add Category</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 mb-3">
                <Package className="h-8 w-8 text-violet-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No categories added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first category to organize products</p>
              <Button variant="outline" size="sm" onClick={openAddCategory} className="mt-4 h-9 text-xs border-violet-200 text-violet-600 hover:bg-violet-50">
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="group relative flex flex-col rounded-xl border border-gray-100 p-4 hover:border-violet-200 hover:bg-violet-50/30 transition-all min-h-[100px]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 shrink-0">
                      <Package className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => openEditCategory(cat)} className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-violet-500 mt-1">Product category</p>
                  {/* Mobile edit/delete always visible */}
                  <div className="flex items-center gap-1 mt-3 sm:hidden">
                    <Button variant="outline" size="sm" onClick={() => openEditCategory(cat)} className="h-8 flex-1 text-xs border-gray-200">
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="h-8 flex-1 text-xs border-red-200 text-red-600">
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderStaffTab = () => (
    <div className="space-y-4 md:space-y-6">
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-purple-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-purple-100 shadow-sm">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Team Members</CardTitle>
                <CardDescription className="text-[11px] md:text-xs text-gray-500">{SAMPLE_STAFF.length} member{SAMPLE_STAFF.length !== 1 ? 's' : ''} · Delivery & warehouse staff</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Feature coming soon')} className="h-8 md:h-9 text-xs border-purple-200 text-purple-600 hover:bg-purple-50 min-w-[44px] md:min-w-0">
              <Plus className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Add Staff</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="space-y-1.5 md:space-y-2">
            {SAMPLE_STAFF.map((staff, index) => (
              <div key={staff.id}>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 md:p-3 hover:bg-gray-50 transition-colors min-h-[44px]">
                  <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                    <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 shrink-0">
                      <span className="text-[10px] md:text-xs font-semibold text-purple-700">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{staff.name}</p>
                      <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-purple-50 text-purple-700 border-purple-100">{staff.role}</Badge>
                        <span className="text-[11px] text-gray-400 truncate hidden sm:inline">{staff.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Feature coming soon')} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Feature coming soon')} className="h-9 w-9 md:h-7 md:w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
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
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-4 md:space-y-6">
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-orange-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-orange-100 shadow-sm">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Notification Preferences</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Choose what alerts you want to receive</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 px-4 md:px-6 pb-4 md:pb-6">
          {[
            { key: 'dailyDeliverySummary' as const, title: 'Daily Delivery Summary', desc: 'Get a summary of deliveries each day', icon: Truck },
            { key: 'lowStockAlerts' as const, title: 'Low Stock Alerts', desc: 'Notify when inventory is running low', icon: Package },
            { key: 'paymentReminders' as const, title: 'Payment Reminders', desc: 'Remind customers about pending payments', icon: IndianRupee },
            { key: 'newLeadNotifications' as const, title: 'New Lead Notifications', desc: 'Get notified when a new lead is added', icon: UserPlus },
          ].map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between py-3.5 md:py-4 min-h-[52px]">
                <div className="flex items-center gap-3 pr-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 shrink-0">
                    <item.icon className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-[11px] md:text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <Switch checked={notifications[item.key]} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))} className="scale-110 md:scale-100" />
              </div>
              {index < 3 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Export/Backup/Restore */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-cyan-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-cyan-100 shadow-sm">
              <Database className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">Data Management</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-gray-500">Export, backup & restore your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6 pb-4 md:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => toast.success('Export started')} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-cyan-200 transition-all text-left min-h-[44px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 shrink-0">
                <Download className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Export Data</p>
                <p className="text-[11px] text-gray-500">Download CSV files</p>
              </div>
            </button>
            <button onClick={() => toast.success('Backup created')} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-cyan-200 transition-all text-left min-h-[44px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 shrink-0">
                <Upload className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Backup</p>
                <p className="text-[11px] text-gray-500">Create data backup</p>
              </div>
            </button>
            <button onClick={() => toast.info('Select backup file')} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-cyan-200 transition-all text-left min-h-[44px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 shrink-0">
                <RotateCcw className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Restore</p>
                <p className="text-[11px] text-gray-500">Restore from backup</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-xl border-red-200/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-r from-red-50/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-red-100 shadow-sm">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold text-red-700">Danger Zone</CardTitle>
              <CardDescription className="text-[11px] md:text-xs text-red-500/70">Irreversible and destructive actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-6 pb-4 md:pb-6">
          <p className="text-xs md:text-sm text-red-600/80">
            Resetting all data will permanently delete all your customers, deliveries, payments, leads, inventory, and settings. Default areas, milk types, and delivery times will be restored. This action cannot be undone.
          </p>
          <Button variant="outline" onClick={() => setResetOpen(true)} className="h-10 md:h-9 text-xs border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700 min-w-[44px] rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const tabContentMap: Record<SettingsTab, () => React.ReactElement> = {
    general: renderGeneralTab,
    delivery: renderDeliveryTab,
    products: renderProductsTab,
    staff: renderStaffTab,
    notifications: renderNotificationsTab,
    data: renderDataTab,
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 md:space-y-0 pb-28 md:pb-20">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm shadow-green-200">
            <Settings className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Configure your dairy shop</p>
          </div>
        </div>

        {/* Desktop save button */}
        {!isMobile && isDirty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSettings(savedSettings)} className="h-9 rounded-lg border-gray-200" disabled={saving}>
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm min-w-[120px]">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-1.5" />Save Changes</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Settings Navigation Tabs ─────────────────────────────────── */}
      {/* Mobile: Horizontal scrollable tabs */}
      {isMobile ? (
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={"flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-all shrink-0 min-h-[44px] " + (isActive ? "bg-green-50 text-green-700 border border-green-200 shadow-sm" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50")}
              >
                <Icon className={"h-3.5 w-3.5 " + (isActive ? "text-green-600" : "text-gray-400")} />
                {tab.mobileLabel}
                {tab.id === 'products' && (milkTypes.length + categories.length) > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[9px] bg-sky-100 text-sky-700 border-0 rounded-full">{milkTypes.length + categories.length}</Badge>
                )}
                {tab.id === 'delivery' && areas.length > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[9px] bg-rose-100 text-rose-700 border-0 rounded-full">{areas.length}</Badge>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        /* Desktop: Sidebar + content layout */
        <div className="flex gap-6">
          {/* Desktop sidebar nav */}
          <div className="w-56 shrink-0">
            <nav className="space-y-1 sticky top-0">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer text-left " + (isActive ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700")}
                  >
                    <div className={"flex h-8 w-8 items-center justify-center rounded-lg shrink-0 " + (isActive ? "bg-green-100" : "bg-gray-50 group-hover:bg-gray-100")}>
                      <Icon className={"h-4 w-4 " + (isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-600")} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate">{tab.label}</p>
                      {isActive && <p className="text-[10px] text-green-600/70 truncate leading-tight mt-0.5">{tab.description}</p>}
                    </div>
                    {tab.id === 'products' && (milkTypes.length + categories.length) > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-sky-100 text-sky-700 border-0 rounded-full shrink-0">{milkTypes.length + categories.length}</Badge>
                    )}
                    {tab.id === 'delivery' && areas.length > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-rose-100 text-rose-700 border-0 rounded-full shrink-0">{areas.length}</Badge>
                    )}
                    {!isActive && <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Desktop content */}
          <div className="flex-1 min-w-0">
            {tabContentMap[activeTab]()}
          </div>
        </div>
      )}

      {/* Mobile: Show content below tabs */}
      {isMobile && tabContentMap[activeTab]()}

      {/* ── Mobile Sticky Save Bar ──────────────────────────────────── */}
      {isDirty && isMobile && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-2.5 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setSettings(savedSettings)} className="h-11 rounded-lg border-gray-200 flex-1 text-sm" disabled={saving}>
              <X className="h-4 w-4 mr-1.5" />Discard
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-11 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm flex-[2] text-sm">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-1.5" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Desktop Sticky Save Bar ──────────────────────────────────── */}
      {isDirty && !isMobile && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-3 z-50">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm text-gray-500">You have unsaved changes</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSettings(savedSettings)} className="h-9 rounded-lg border-gray-200" disabled={saving}>
                Discard
              </Button>
              <Button onClick={handleSave} disabled={saving} className="h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm min-w-[120px]">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" />Save Changes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset All Data Confirmation ─────────────────────────────── */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="mx-4 md:mx-auto max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Reset All Data
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed pt-1">
              This will permanently delete all your customers, deliveries, payments, leads, inventory, and settings. Default areas, milk types, and delivery times will be restored. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-lg h-11 sm:h-auto" disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={resetting} className="rounded-lg bg-red-600 hover:bg-red-700 text-white h-11 sm:h-auto min-w-[140px]">
              {resetting ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Resetting...</>
              ) : (
                <><AlertTriangle className="h-4 w-4 mr-1.5" />Reset Everything</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Area Add/Edit Dialog ─────────────────────────────────────── */}
      <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
        <DialogContent className={`sm:max-w-[400px] ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0 flex flex-col justify-end' : ''}`}>
          <DialogHeader className={isMobile ? 'px-1' : ''}>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <MapPin className="h-4 w-4 text-rose-600" />
              </div>
              {editingArea ? 'Edit Area' : 'Add Area'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Area Name</Label>
              <Input placeholder="Enter area name" value={areaName} onChange={(e) => setAreaName(e.target.value)} className="rounded-lg border-gray-200 h-11 md:h-auto" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAreaSubmit() }} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setAreaDialogOpen(false)} className="rounded-lg flex-1 sm:flex-none h-11 sm:h-auto" disabled={areaSubmitting}>Cancel</Button>
            <Button onClick={handleAreaSubmit} disabled={areaSubmitting} className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white min-w-[100px] flex-1 sm:flex-none h-11 sm:h-auto">
              {areaSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingArea ? 'Update' : 'Add Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Milk Type Add/Edit Dialog ────────────────────────────────── */}
      <Dialog open={milkTypeDialogOpen} onOpenChange={setMilkTypeDialogOpen}>
        <DialogContent className={`sm:max-w-[400px] ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0 flex flex-col justify-end' : ''}`}>
          <DialogHeader className={isMobile ? 'px-1' : ''}>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                <Milk className="h-4 w-4 text-sky-600" />
              </div>
              {editingMilkType ? 'Edit Milk Type' : 'Add Milk Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Milk Type Name</Label>
              <Input placeholder="e.g. Fresh, Buffalo, Camel" value={milkTypeName} onChange={(e) => setMilkTypeName(e.target.value)} className="rounded-lg border-gray-200 h-11 md:h-auto" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Price per Liter (PKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₨</span>
                <Input type="number" placeholder="60" value={milkTypePrice} onChange={(e) => setMilkTypePrice(e.target.value)} className="rounded-lg border-gray-200 pl-8 h-11 md:h-auto" onKeyDown={(e) => { if (e.key === 'Enter') handleMilkTypeSubmit() }} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setMilkTypeDialogOpen(false)} className="rounded-lg flex-1 sm:flex-none h-11 sm:h-auto" disabled={milkTypeSubmitting}>Cancel</Button>
            <Button onClick={handleMilkTypeSubmit} disabled={milkTypeSubmitting} className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white min-w-[100px] flex-1 sm:flex-none h-11 sm:h-auto">
              {milkTypeSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingMilkType ? 'Update' : 'Add Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delivery Time Add/Edit Dialog ────────────────────────────── */}
      <Dialog open={deliveryTimeDialogOpen} onOpenChange={setDeliveryTimeDialogOpen}>
        <DialogContent className={`sm:max-w-[400px] ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0 flex flex-col justify-end' : ''}`}>
          <DialogHeader className={isMobile ? 'px-1' : ''}>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <Clock className="h-4 w-4 text-teal-600" />
              </div>
              {editingDeliveryTime ? 'Edit Delivery Time' : 'Add Delivery Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Delivery Time</Label>
              <Input placeholder="e.g. Morning 6-9 AM" value={deliveryTimeName} onChange={(e) => setDeliveryTimeName(e.target.value)} className="rounded-lg border-gray-200 h-11 md:h-auto" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleDeliveryTimeSubmit() }} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeliveryTimeDialogOpen(false)} className="rounded-lg flex-1 sm:flex-none h-11 sm:h-auto" disabled={deliveryTimeSubmitting}>Cancel</Button>
            <Button onClick={handleDeliveryTimeSubmit} disabled={deliveryTimeSubmitting} className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white min-w-[100px] flex-1 sm:flex-none h-11 sm:h-auto">
              {deliveryTimeSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDeliveryTime ? 'Update' : 'Add Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Add/Edit Dialog ──────────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className={`sm:max-w-[400px] ${isMobile ? 'w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] rounded-none border-0 flex flex-col justify-end' : ''}`}>
          <DialogHeader className={isMobile ? 'px-1' : ''}>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                <Package className="h-4 w-4 text-violet-600" />
              </div>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Category Name</Label>
              <Input placeholder="e.g. Milk, Yogurt, Butter" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="rounded-lg border-gray-200 h-11 md:h-auto" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCategorySubmit() }} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="rounded-lg flex-1 sm:flex-none h-11 sm:h-auto" disabled={categorySubmitting}>Cancel</Button>
            <Button onClick={handleCategorySubmit} disabled={categorySubmitting} className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white min-w-[100px] flex-1 sm:flex-none h-11 sm:h-auto">
              {categorySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCategory ? 'Update' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
