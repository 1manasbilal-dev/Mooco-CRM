'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  UserPlus,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  ArrowRightLeft,
  XCircle,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ── Types ──────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  phone: string
  area: string
  address: string
  expectedQty: number
  status: string
  notes: string
  source: string
  createdAt: string
  updatedAt: string
  convertedToId: string | null
}

interface LeadFormData {
  name: string
  phone: string
  area: string
  address: string
  expectedQty: number
  source: string
  notes: string
}

// ── Constants ──────────────────────────────────────────

const STATUSES = ['New', 'Contacted', 'Trial', 'Converted', 'Lost'] as const

const SOURCES = ['Walk-in', 'Phone', 'Referral', 'Online', 'Ad'] as const

const AREAS = [
  'Gulshan-e-Iqbal',
  'DHA Phase 5',
  'Clifton Block 2',
  'Bahadurabad',
  'PECHS',
  'North Nazimabad',
  'Saddar',
  'Defence View',
  'Kharadar',
  'Liaquatabad',
] as const

const EMPTY_FORM: LeadFormData = {
  name: '',
  phone: '',
  area: '',
  address: '',
  expectedQty: 0,
  source: 'Walk-in',
  notes: '',
}

// ── Helpers ────────────────────────────────────────────

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'New':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Contacted':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Trial':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Converted':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'Lost':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function sourceBadgeClasses(source: string): string {
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function formatQty(qty: number): string {
  return `${qty}L/day`
}

// ── Component ──────────────────────────────────────────

export default function LeadsPage() {
  // State
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState<LeadFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Convert dialog
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [converting, setConverting] = useState(false)

  // Delete dialog
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch leads ──────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (areaFilter && areaFilter !== 'all') params.set('area', areaFilter)

      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data: Lead[] = await res.json()
      setLeads(data)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, areaFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ── Filtered leads (client-side search) ──────────────

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q)
    )
  })

  // ── Form handlers ────────────────────────────────────

  function openAddForm() {
    setEditingLead(null)
    setFormData(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEditForm(lead: Lead) {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      phone: lead.phone,
      area: lead.area,
      address: lead.address,
      expectedQty: lead.expectedQty,
      source: lead.source,
      notes: lead.notes,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingLead(null)
    setFormData(EMPTY_FORM)
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.area) {
      toast.error('Name, phone, and area are required')
      return
    }

    setSubmitting(true)
    try {
      if (editingLead) {
        // Update
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error()
        toast.success('Lead updated successfully')
      } else {
        // Create
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error()
        toast.success('Lead created successfully')
      }
      closeForm()
      fetchLeads()
    } catch {
      toast.error(editingLead ? 'Failed to update lead' : 'Failed to create lead')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Convert handler ──────────────────────────────────

  async function handleConvert() {
    if (!convertLead) return
    setConverting(true)
    try {
      const res = await fetch(`/api/leads/${convertLead.id}/convert`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to convert lead')
      }
      toast.success(`${convertLead.name} has been converted to a customer`)
      setConvertLead(null)
      fetchLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert lead')
    } finally {
      setConverting(false)
    }
  }

  // ── Delete handler ───────────────────────────────────

  async function handleDelete() {
    if (!deleteLead) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${deleteLead.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Lead deleted successfully')
      setDeleteLead(null)
      fetchLeads()
    } catch {
      toast.error('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  // ── Mark Lost handler ────────────────────────────────

  async function handleMarkLost(lead: Lead) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Lost' }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${lead.name} marked as Lost`)
      fetchLeads()
    } catch {
      toast.error('Failed to update lead status')
    }
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
            <UserPlus className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500">Manage new customer inquiries</p>
          </div>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* ── Filter Bar ─────────────────────────────── */}
      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Area Filter */}
            <Select
              value={areaFilter}
              onValueChange={setAreaFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1 min-w-0 sm:max-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Count */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 sm:ml-auto">
              <Users className="h-4 w-4" />
              Showing <span className="font-medium text-gray-700">{filteredLeads.length}</span> leads
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading State ──────────────────────────── */}
      {loading && (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-500">Loading leads...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ────────────────────────────── */}
      {!loading && filteredLeads.length === 0 && (
        <Card className="rounded-xl border-gray-200 shadow-sm">
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <UserPlus className="h-7 w-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">No leads found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== 'all' || areaFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Add your first lead to get started'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'all' && areaFilter === 'all' && (
              <Button
                onClick={openAddForm}
                className="mt-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Desktop Table ──────────────────────────── */}
      {!loading && filteredLeads.length > 0 && (
        <>
          <div className="hidden md:block">
            <Card className="rounded-xl border-gray-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="pl-4 font-semibold text-gray-600">Name</TableHead>
                    <TableHead className="font-semibold text-gray-600">Area</TableHead>
                    <TableHead className="font-semibold text-gray-600">Expected Qty</TableHead>
                    <TableHead className="font-semibold text-gray-600">Source</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="text-right pr-4 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="group">
                      <TableCell className="pl-4">
                        <div>
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{lead.area}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-700">
                          {formatQty(lead.expectedQty)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${sourceBadgeClasses(lead.source)}`}
                        >
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClasses(lead.status)}`}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openEditForm(lead)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {lead.status !== 'Converted' && (
                              <DropdownMenuItem onClick={() => setConvertLead(lead)}>
                                <ArrowRightLeft className="h-4 w-4" />
                                Convert to Customer
                              </DropdownMenuItem>
                            )}
                            {lead.status !== 'Lost' && lead.status !== 'Converted' && (
                              <DropdownMenuItem onClick={() => handleMarkLost(lead)}>
                                <XCircle className="h-4 w-4" />
                                Mark Lost
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteLead(lead)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* ── Mobile Cards ────────────────────────── */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="rounded-xl border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClasses(lead.status)}`}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{lead.phone}</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditForm(lead)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {lead.status !== 'Converted' && (
                          <DropdownMenuItem onClick={() => setConvertLead(lead)}>
                            <ArrowRightLeft className="h-4 w-4" />
                            Convert to Customer
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'Lost' && lead.status !== 'Converted' && (
                          <DropdownMenuItem onClick={() => handleMarkLost(lead)}>
                            <XCircle className="h-4 w-4" />
                            Mark Lost
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteLead(lead)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">{lead.area}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-medium text-gray-700">{formatQty(lead.expectedQty)}</span>
                    <span className="text-gray-300">·</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${sourceBadgeClasses(lead.source)}`}
                    >
                      {lead.source}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Add/Edit Lead Dialog ─────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
            <DialogDescription>
              {editingLead
                ? 'Update the lead information below.'
                : 'Fill in the details for the new lead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="lead-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lead-name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="lead-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lead-phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            {/* Area */}
            <div className="grid gap-2">
              <Label htmlFor="lead-area">
                Area <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.area}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, area: value }))
                }
              >
                <SelectTrigger id="lead-area" className="w-full">
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

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="lead-address">Address</Label>
              <Input
                id="lead-address"
                placeholder="Enter delivery address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            {/* Expected Qty + Source */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-qty">Expected Daily Qty (L)</Label>
                <Input
                  id="lead-qty"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="0"
                  value={formData.expectedQty || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedQty: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger id="lead-source" className="w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                placeholder="Additional notes about this lead..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Convert Confirmation Dialog ──────────────── */}
      <Dialog open={!!convertLead} onOpenChange={(open) => !open && setConvertLead(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Convert to Customer</DialogTitle>
            <DialogDescription>
              Convert <span className="font-semibold text-gray-900">{convertLead?.name}</span> to a customer?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will create a new customer with the lead&apos;s details. The lead status will be updated to
            &quot;Converted&quot;.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertLead(null)}
              disabled={converting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {converting && <Loader2 className="h-4 w-4 animate-spin" />}
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────── */}
      <AlertDialog
        open={!!deleteLead}
        onOpenChange={(open) => !open && setDeleteLead(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
