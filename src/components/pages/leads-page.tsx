'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  Phone,
  MapPin,
  Droplets,
  Calendar,
  TrendingUp,
  Filter,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Layers,
  SlidersHorizontal,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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

const PIPELINE_STAGES = [
  { id: 'New', label: 'New', color: 'blue', bgClass: 'bg-blue-500', lightBg: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-l-blue-500', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', hoverBorder: 'hover:border-blue-300', overRing: 'ring-blue-200' },
  { id: 'Contacted', label: 'Contacted', color: 'amber', bgClass: 'bg-amber-500', lightBg: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-l-amber-500', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', hoverBorder: 'hover:border-amber-300', overRing: 'ring-amber-200' },
  { id: 'Trial', label: 'Trial', color: 'purple', bgClass: 'bg-purple-500', lightBg: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-l-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', hoverBorder: 'hover:border-purple-300', overRing: 'ring-purple-200' },
  { id: 'Converted', label: 'Converted', color: 'green', bgClass: 'bg-green-500', lightBg: 'bg-green-50', textClass: 'text-green-700', borderClass: 'border-l-green-500', badgeBg: 'bg-green-100', badgeText: 'text-green-700', hoverBorder: 'hover:border-green-300', overRing: 'ring-green-200' },
  { id: 'Lost', label: 'Lost', color: 'red', bgClass: 'bg-red-500', lightBg: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-l-red-500', badgeBg: 'bg-red-100', badgeText: 'text-red-700', hoverBorder: 'hover:border-red-300', overRing: 'ring-red-200' },
] as const

const SOURCES = ['Walk-in', 'Phone', 'Referral', 'Online', 'Ad'] as const

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

function getStageConfig(status: string) {
  return PIPELINE_STAGES.find((s) => s.id === status) ?? PIPELINE_STAGES[0]
}

function sourceBadgeClasses(source: string): string {
  const map: Record<string, string> = {
    'Walk-in': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Phone': 'bg-sky-50 text-sky-700 border-sky-200',
    'Referral': 'bg-violet-50 text-violet-700 border-violet-200',
    'Online': 'bg-orange-50 text-orange-700 border-orange-200',
    'Ad': 'bg-pink-50 text-pink-700 border-pink-200',
  }
  return map[source] ?? 'bg-gray-50 text-gray-600 border-gray-200'
}

function formatQty(qty: number): string {
  return `${qty}L/day`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

// ── Sortable Lead Card ─────────────────────────────────

function SortableLeadCard({
  lead,
  onEdit,
  onConvert,
  onMarkLost,
  onDelete,
}: {
  lead: Lead
  onEdit: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onMarkLost: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const stage = getStageConfig(lead.status)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`group border border-l-4 ${stage.borderClass} bg-white rounded-lg md:rounded-lg shadow-sm md:shadow-sm hover:shadow-md transition-all duration-200 ${stage.hoverBorder} cursor-default`}
      >
        <CardContent className="p-2.5 md:p-3">
          {/* Top row: Drag handle + Name + Menu */}
          <div className="flex items-start gap-1 md:gap-1.5">
            {/* Drag handle - larger on mobile for better touch target */}
            <button
              className="mt-0 md:mt-1 flex h-11 w-6 md:h-auto md:w-auto items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 active:text-gray-600 transition-colors shrink-0 rounded-md hover:bg-gray-50 active:bg-gray-100 md:rounded-none md:hover:bg-transparent md:active:bg-transparent touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 md:h-4 md:w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {lead.name}
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 md:h-7 md:w-7 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4 md:h-3.5 md:w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(lead)} className="min-h-[44px] md:min-h-0">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {lead.status !== 'Converted' && (
                      <DropdownMenuItem onClick={() => onConvert(lead)} className="min-h-[44px] md:min-h-0">
                        <ArrowRightLeft className="h-4 w-4" />
                        Convert to Customer
                      </DropdownMenuItem>
                    )}
                    {lead.status !== 'Lost' && lead.status !== 'Converted' && (
                      <DropdownMenuItem onClick={() => onMarkLost(lead)} className="min-h-[44px] md:min-h-0">
                        <XCircle className="h-4 w-4" />
                        Mark Lost
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(lead)}
                      className="min-h-[44px] md:min-h-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.phone}</span>
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="mt-2 ml-0 md:ml-[22px] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span>{lead.area}</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-gray-400" />
              <span className="font-medium">{formatQty(lead.expectedQty)}</span>
            </div>
          </div>

          {/* Source badge + date */}
          <div className="mt-2 ml-0 md:ml-[22px] flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 ${sourceBadgeClasses(lead.source)}`}
            >
              {lead.source}
            </Badge>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(lead.createdAt)}
            </span>
          </div>

          {/* Expandable details */}
          {expanded && (lead.address || lead.notes) && (
            <div className="mt-2.5 ml-0 md:ml-[22px] pt-2.5 border-t border-gray-100">
              {lead.address && (
                <p className="text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-600">Address:</span>{' '}
                  {lead.address}
                </p>
              )}
              {lead.notes && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Notes:</span>{' '}
                  {lead.notes}
                </p>
              )}
            </div>
          )}

          {/* Expand toggle - larger touch target on mobile */}
          {(lead.address || lead.notes) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 ml-0 md:ml-[22px] flex items-center gap-0.5 text-[10px] md:text-[10px] text-gray-400 hover:text-gray-600 transition-colors min-h-[32px] md:min-h-0"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> More
                </>
              )}
            </button>
          )}

          {/* Quick action buttons - always visible on mobile, hover on desktop */}
          {lead.status !== 'Converted' && lead.status !== 'Lost' && (
            <div className="mt-2 ml-0 md:ml-[22px] flex gap-1.5 md:gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                className="h-8 md:h-6 text-[11px] md:text-[10px] px-3 md:px-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 min-w-[44px] md:min-w-0"
                onClick={() => onConvert(lead)}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 md:h-3 md:w-3 mr-1 md:mr-1" />
                Convert
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 md:h-6 text-[11px] md:text-[10px] px-3 md:px-2 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 min-w-[44px] md:min-w-0"
                onClick={() => onMarkLost(lead)}
              >
                <XCircle className="h-3.5 w-3.5 md:h-3 md:w-3 mr-1 md:mr-1" />
                Lost
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Drag Overlay Card ──────────────────────────────────

function DragOverlayCard({ lead }: { lead: Lead }) {
  const stage = getStageConfig(lead.status)
  return (
    <Card
      className={`border border-l-4 ${stage.borderClass} bg-white rounded-lg shadow-xl rotate-2 scale-105 w-[280px]`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">
              {lead.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span>{lead.area}</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-gray-400" />
                <span className="font-medium">{formatQty(lead.expectedQty)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Kanban Column ──────────────────────────────────────

function DroppableKanbanColumn({
  stage,
  leads,
  onEdit,
  onConvert,
  onMarkLost,
  onDelete,
}: {
  stage: typeof PIPELINE_STAGES[number]
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onMarkLost: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}) {
  const leadIds = leads.map((l) => l.id)
  const totalQty = leads.reduce((sum, l) => sum + l.expectedQty, 0)

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'column',
      status: stage.id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] lg:min-w-[300px] lg:w-[300px] shrink-0 rounded-lg transition-colors duration-200 ${
        isOver ? `${stage.lightBg} ring-1 ring-inset ${stage.overRing}` : ''
      }`}
    >
      {/* Column header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${stage.bgClass}`} />
            <h3 className="font-semibold text-sm text-gray-800">{stage.label}</h3>
            <Badge
              variant="secondary"
              className={`h-5 min-w-[20px] px-1.5 text-[10px] ${stage.badgeBg} ${stage.badgeText} border-0`}
            >
              {leads.length}
            </Badge>
          </div>
          {totalQty > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">
              {totalQty}L/day
            </span>
          )}
        </div>
        <div className={`h-0.5 rounded-full ${stage.bgClass} opacity-30`} />
      </div>

      {/* Cards */}
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-0.5 custom-scrollbar">
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
              <p className="text-xs text-gray-400 text-center">No leads here</p>
              {isOver && (
                <p className="text-[10px] mt-1 text-gray-400">Drop here</p>
              )}
            </div>
          )}
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onConvert={onConvert}
              onMarkLost={onMarkLost}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────

export default function LeadsPage() {
  // State
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])

  // Drag state
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

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

  // ── DnD sensors ────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // ── Fetch leads ──────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
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
  }, [areaFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Fetch areas dynamically
  useEffect(() => {
    async function fetchAreas() {
      try {
        const res = await fetch('/api/areas')
        if (res.ok) {
          const data = await res.json()
          setAreas(Array.isArray(data) ? data : [])
        }
      } catch { /* ignore */ }
    }
    fetchAreas()
  }, [])

  // ── Filtered leads (client-side search + source filter) ──

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (sourceFilter && sourceFilter !== 'all' && lead.source !== sourceFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q)
      )
    })
  }, [leads, searchQuery, sourceFilter])

  // ── Group leads by status ──────────────────────────

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    for (const stage of PIPELINE_STAGES) {
      grouped[stage.id] = []
    }
    for (const lead of filteredLeads) {
      if (!grouped[lead.status]) {
        grouped[lead.status] = []
      }
      grouped[lead.status].push(lead)
    }
    return grouped
  }, [filteredLeads])

  // ── Pipeline stats ─────────────────────────────────

  const stats = useMemo(() => {
    const total = filteredLeads.length
    const converted = filteredLeads.filter((l) => l.status === 'Converted').length
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0'
    const totalQty = filteredLeads.reduce((sum, l) => sum + l.expectedQty, 0)
    const activeLeads = filteredLeads.filter(
      (l) => l.status !== 'Converted' && l.status !== 'Lost'
    ).length
    return { total, converted, conversionRate, totalQty, activeLeads }
  }, [filteredLeads])

  // ── DnD handlers ───────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const lead = leads.find((l) => l.id === active.id)
    if (lead) {
      setActiveLead(lead)
    }
  }

  function handleDragOver(_event: DragOverEvent) {
    // We handle the actual move on drag end
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveLead(null)

    if (!over) return

    const leadId = active.id as string
    const currentLead = leads.find((l) => l.id === leadId)
    if (!currentLead) return

    // Determine the target column
    // The "over" can be either a column droppable or another lead card
    let targetStatus: string | null = null

    // Check if dropped on a column directly
    const overId = over.id as string
    if (PIPELINE_STAGES.some((s) => s.id === overId)) {
      targetStatus = overId
    } else {
      // Dropped on another lead card — find which column that lead is in
      const overLead = leads.find((l) => l.id === overId)
      if (overLead) {
        targetStatus = overLead.status
      }
    }

    if (!targetStatus || targetStatus === currentLead.status) return

    // If dropped on "Converted", trigger convert dialog
    if (targetStatus === 'Converted') {
      setConvertLead(currentLead)
      return
    }

    // Optimistically update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus! } : l))
    )

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${currentLead.name} moved to ${targetStatus}`)
    } catch {
      // Revert on failure
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: currentLead.status } : l))
      )
      toast.error('Failed to update lead status')
    }
  }

  function handleDragCancel() {
    setActiveLead(null)
  }

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
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error()
        toast.success('Lead updated successfully')
      } else {
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
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'Lost' } : l))
    )
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Lost' }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${lead.name} marked as Lost`)
    } catch {
      // Revert
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      )
      toast.error('Failed to update lead status')
    }
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-3 md:space-y-5">
      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm shrink-0">
            <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Leads Pipeline</h1>
            <p className="text-xs md:text-sm text-gray-500 truncate">Track and manage your sales pipeline</p>
          </div>
        </div>
        {/* Full-width on mobile, normal on desktop */}
        <Button
          onClick={openAddForm}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shadow-green-200/50 shrink-0 h-9 md:h-auto px-3 md:px-4"
        >
          <Plus className="h-4 w-4 md:mr-1" />
          <span className="hidden md:inline">Add Lead</span>
        </Button>
      </div>

      {/* ── Pipeline Statistics Bar ────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
          <Card className="rounded-xl md:rounded-xl border-gray-200/80 shadow-sm bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow">
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-gray-100">
                  <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-600" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-500 truncate">Total Leads</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-gray-900 md:ml-9">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-gray-200/80 shadow-sm bg-gradient-to-br from-white to-green-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-green-100">
                  <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-500 truncate">Conversion</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-green-700 md:ml-9">{stats.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-gray-200/80 shadow-sm bg-gradient-to-br from-white to-blue-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-blue-100">
                  <Layers className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-500 truncate">Active</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-blue-700 md:ml-9">{stats.activeLeads}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-gray-200/80 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md transition-shadow">
            <CardContent className="p-2.5 md:p-3.5">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-emerald-100">
                  <Droplets className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-500 truncate">Daily Qty</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-emerald-700 md:ml-9">{stats.totalQty}L</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-gray-200/80 shadow-sm bg-gradient-to-br from-white to-green-50/30 col-span-2 lg:col-span-1 hidden lg:block hover:shadow-md transition-shadow">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Converted</span>
              </div>
              <p className="text-xl font-bold text-green-700 ml-9">{stats.converted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filters & Search Bar ─────────────────────── */}
      <Card className="rounded-xl border-gray-200/80 shadow-sm">
        <CardContent className="p-2.5 md:p-3">
          <div className="flex flex-col gap-2.5 md:gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search - full width on mobile */}
            <div className="relative flex-1 min-w-0 sm:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 md:h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-0">
              {/* Toggle filters */}
              <Button
                variant="outline"
                size="sm"
                className="h-10 md:h-9 gap-1.5 flex-1 md:flex-none min-w-[44px]"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 md:hidden" />
                <Filter className="h-3.5 w-3.5 hidden md:block" />
                <span className="md:hidden">Filters</span>
                <span className="hidden md:inline">Filters</span>
                {(areaFilter !== 'all' || sourceFilter !== 'all') && (
                  <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-green-600 text-white border-0">
                    {(areaFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              {/* Count */}
              <div className="flex items-center gap-1.5 text-sm text-gray-500 sm:ml-auto md:ml-auto ml-0">
                <Users className="h-4 w-4" />
                <span className="font-medium text-gray-700">{filteredLeads.length}</span>
                <span className="hidden sm:inline">leads</span>
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <>
              <Separator className="my-2.5 md:my-3" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0">Area:</span>
                  <Select
                    value={areaFilter}
                    onValueChange={setAreaFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-8 text-xs">
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0">Source:</span>
                  <Select
                    value={sourceFilter}
                    onValueChange={setSourceFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-8 text-xs">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(areaFilter !== 'all' || sourceFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 md:h-8 text-xs text-gray-500 min-w-[44px]"
                    onClick={() => {
                      setAreaFilter('all')
                      setSourceFilter('all')
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Loading State ────────────────────────────── */}
      {loading && (
        <Card className="rounded-xl border-gray-200/80 shadow-sm">
          <CardContent className="flex h-48 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-500">Loading pipeline...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ──────────────────────────────── */}
      {!loading && filteredLeads.length === 0 && (
        <Card className="rounded-xl border-gray-200/80 shadow-sm">
          <CardContent className="flex h-56 md:h-64 flex-col items-center justify-center gap-3 p-6">
            <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-50 to-gray-100">
              <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">No leads found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || areaFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Add your first lead to get started'}
              </p>
            </div>
            {!searchQuery && areaFilter === 'all' && sourceFilter === 'all' && (
              <Button
                onClick={openAddForm}
                className="mt-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shadow-green-200/50 min-h-[44px]"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Kanban Board ─────────────────────────────── */}
      {!loading && filteredLeads.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Desktop: horizontal scroll Kanban */}
          <div className="hidden md:block">
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-horizontal">
              {PIPELINE_STAGES.map((stage) => (
                <DroppableKanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={leadsByStatus[stage.id] || []}
                  onEdit={openEditForm}
                  onConvert={(lead) => setConvertLead(lead)}
                  onMarkLost={handleMarkLost}
                  onDelete={(lead) => setDeleteLead(lead)}
                />
              ))}
            </div>
          </div>

          {/* Mobile: vertical stacked columns */}
          <div className="flex flex-col gap-3 md:hidden">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = leadsByStatus[stage.id] || []
              const totalQty = stageLeads.reduce((sum, l) => sum + l.expectedQty, 0)
              return (
                <Card key={stage.id} className="rounded-xl border-gray-200/80 shadow-sm overflow-hidden">
                  {/* Mobile column header */}
                  <div
                    className={`px-3 py-2.5 flex items-center justify-between ${stage.lightBg} border-b border-gray-100/80`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${stage.bgClass} shadow-sm`} />
                      <h3 className="font-semibold text-sm text-gray-800">{stage.label}</h3>
                      <Badge
                        variant="secondary"
                        className={`h-5 min-w-[20px] px-1.5 text-[10px] ${stage.badgeBg} ${stage.badgeText} border-0`}
                      >
                        {stageLeads.length}
                      </Badge>
                    </div>
                    {totalQty > 0 && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {totalQty}L/day
                      </span>
                    )}
                  </div>
                  {/* Mobile cards */}
                  <div className="p-2 space-y-2">
                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 px-4">
                        <p className="text-xs text-gray-400 text-center">No leads here</p>
                      </div>
                    )}
                    {stageLeads.map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        onEdit={openEditForm}
                        onConvert={(l) => setConvertLead(l)}
                        onMarkLost={handleMarkLost}
                        onDelete={(l) => setDeleteLead(l)}
                      />
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Add/Edit Lead Dialog ─────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-[520px] p-0 md:p-6 gap-0 md:gap-4 max-h-[100dvh] md:max-h-[90vh] overflow-y-auto md:rounded-lg rounded-none inset-0 md:inset-auto translate-x-0 md:translate-x-[-50%] translate-y-0 md:translate-y-[-50%] fixed md:absolute w-full md:w-auto md:max-w-[calc(100%-2rem)]">
          <div className="sticky top-0 bg-background z-10 px-4 pt-4 pb-2 md:p-0 border-b md:border-b-0">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-lg">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                {editingLead
                  ? 'Update the lead information below.'
                  : 'Fill in the details for the new lead.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-3 md:gap-4 px-4 py-3 md:p-0">
            {/* Name */}
            <div className="grid gap-1.5 md:gap-2">
              <Label htmlFor="lead-name" className="text-sm">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lead-name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 md:h-auto"
              />
            </div>

            {/* Phone */}
            <div className="grid gap-1.5 md:gap-2">
              <Label htmlFor="lead-phone" className="text-sm">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lead-phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-11 md:h-auto"
              />
            </div>

            {/* Area */}
            <div className="grid gap-1.5 md:gap-2">
              <Label htmlFor="lead-area" className="text-sm">
                Area <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.area}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, area: value }))
                }
              >
                <SelectTrigger id="lead-area" className="w-full h-11 md:h-auto">
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

            {/* Address */}
            <div className="grid gap-1.5 md:gap-2">
              <Label htmlFor="lead-address" className="text-sm">Address</Label>
              <Input
                id="lead-address"
                placeholder="Enter delivery address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="h-11 md:h-auto"
              />
            </div>

            {/* Expected Qty + Source */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="lead-qty" className="text-sm">Daily Qty (L)</Label>
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
                  className="h-11 md:h-auto"
                />
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="lead-source" className="text-sm">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger id="lead-source" className="w-full h-11 md:h-auto">
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
            <div className="grid gap-1.5 md:gap-2">
              <Label htmlFor="lead-notes" className="text-sm">Notes</Label>
              <Textarea
                id="lead-notes"
                placeholder="Additional notes about this lead..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background z-10 px-4 pb-4 pt-3 md:p-0 border-t md:border-t-0">
            <DialogFooter className="flex-row gap-2 sm:flex-row">
              <Button variant="outline" onClick={closeForm} disabled={submitting} className="flex-1 md:flex-none min-h-[44px] md:min-h-0">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 md:flex-none min-h-[44px] md:min-h-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shadow-green-200/50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingLead ? 'Update Lead' : 'Create Lead'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Convert Confirmation Dialog ──────────────── */}
      <Dialog open={!!convertLead} onOpenChange={(open) => !open && setConvertLead(null)}>
        <DialogContent className="sm:max-w-[420px] p-4 md:p-6 gap-0 md:gap-4 max-h-[100dvh] md:max-h-[90vh] overflow-y-auto md:rounded-lg rounded-none inset-0 md:inset-auto translate-x-0 md:translate-x-[-50%] translate-y-0 md:translate-y-[-50%] fixed md:absolute w-full md:w-auto md:max-w-[calc(100%-2rem)]">
          <DialogHeader className="pb-2 md:pb-0">
            <DialogTitle>Convert to Customer</DialogTitle>
            <DialogDescription>
              Convert <span className="font-semibold text-gray-900">{convertLead?.name}</span> to a customer?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500 px-0 md:px-0">
            This will create a new customer with the lead&apos;s details. The lead status will be updated to
            &quot;Converted&quot;.
          </p>
          <DialogFooter className="flex-row gap-2 sm:flex-row pt-2 md:pt-0">
            <Button
              variant="outline"
              onClick={() => setConvertLead(null)}
              disabled={converting}
              className="flex-1 md:flex-none min-h-[44px] md:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={converting}
              className="flex-1 md:flex-none min-h-[44px] md:min-h-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shadow-green-200/50"
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
        <AlertDialogContent className="rounded-none md:rounded-lg max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel disabled={deleting} className="flex-1 md:flex-none min-h-[44px] md:min-h-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 md:flex-none min-h-[44px] md:min-h-0 bg-red-600 hover:bg-red-700 text-white"
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
