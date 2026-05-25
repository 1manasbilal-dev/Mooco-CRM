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
  ChevronRight,
  MessageSquare,
  UserCheck,
  Sparkles,
  X,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Building2,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

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
  { id: 'New', label: 'New', icon: Sparkles, color: 'blue', bgClass: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/50', textClass: 'text-blue-700', borderClass: 'border-l-blue-500', badgeBg: 'bg-blue-100 dark:bg-blue-900', badgeText: 'text-blue-700 dark:text-blue-300', hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700', overRing: 'ring-blue-200 dark:ring-blue-800', dotClass: 'bg-blue-400', cardBorder: 'border-blue-200 dark:border-blue-800', cardBg: 'bg-blue-50/50 dark:bg-blue-950/30' },
  { id: 'Contacted', label: 'Contacted', icon: Phone, color: 'amber', bgClass: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/50', textClass: 'text-amber-700', borderClass: 'border-l-amber-500', badgeBg: 'bg-amber-100 dark:bg-amber-900', badgeText: 'text-amber-700 dark:text-amber-300', hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700', overRing: 'ring-amber-200 dark:ring-amber-800', dotClass: 'bg-amber-400', cardBorder: 'border-amber-200 dark:border-amber-800', cardBg: 'bg-amber-50/50 dark:bg-amber-950/30' },
  { id: 'Trial', label: 'Trial', icon: Clock, color: 'purple', bgClass: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/50', textClass: 'text-purple-700', borderClass: 'border-l-purple-500', badgeBg: 'bg-purple-100 dark:bg-purple-900', badgeText: 'text-purple-700 dark:text-purple-300', hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700', overRing: 'ring-purple-200 dark:ring-purple-800', dotClass: 'bg-purple-400', cardBorder: 'border-purple-200 dark:border-purple-800', cardBg: 'bg-purple-50/50 dark:bg-purple-950/30' },
  { id: 'Converted', label: 'Converted', icon: CheckCircle2, color: 'green', bgClass: 'bg-green-500', lightBg: 'bg-green-50 dark:bg-green-950/50', textClass: 'text-green-700', borderClass: 'border-l-green-500', badgeBg: 'bg-green-100 dark:bg-green-900', badgeText: 'text-green-700 dark:text-green-300', hoverBorder: 'hover:border-green-300 dark:hover:border-green-700', overRing: 'ring-green-200 dark:ring-green-800', dotClass: 'bg-green-400', cardBorder: 'border-green-200 dark:border-green-800', cardBg: 'bg-green-50/50 dark:bg-green-950/30' },
  { id: 'Lost', label: 'Lost', icon: XCircle, color: 'red', bgClass: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-950/50', textClass: 'text-red-700', borderClass: 'border-l-red-500', badgeBg: 'bg-red-100 dark:bg-red-900', badgeText: 'text-red-700 dark:text-red-300', hoverBorder: 'hover:border-red-300 dark:hover:border-red-700', overRing: 'ring-red-200 dark:ring-red-800', dotClass: 'bg-red-400', cardBorder: 'border-red-200 dark:border-red-800', cardBg: 'bg-red-50/50 dark:bg-red-950/30' },
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
    'Walk-in': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    'Phone': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    'Referral': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
    'Online': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    'Ad': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  }
  return map[source] ?? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
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

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function getStageColor(status: string): string {
  const map: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'Contacted': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'Trial': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    'Converted': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'Lost': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

function getAvatarGradient(status: string): string {
  const map: Record<string, string> = {
    'New': 'from-blue-400 to-blue-600',
    'Contacted': 'from-amber-400 to-amber-600',
    'Trial': 'from-purple-400 to-purple-600',
    'Converted': 'from-green-400 to-emerald-600',
    'Lost': 'from-red-400 to-red-600',
  }
  return map[status] ?? 'from-gray-400 to-gray-600'
}

// ── Sortable Lead Card (Desktop Kanban) ────────────────

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
    data: { type: 'lead', lead },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`group border ${stage.cardBorder} ${stage.cardBg} rounded-xl p-3 hover:shadow-md transition-all duration-200 cursor-default`}>
        <div className="flex items-start gap-2.5">
          {/* Drag handle */}
          <button
            className="mt-2 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors shrink-0 touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(lead.status)} shrink-0 shadow-sm`}>
            <span className="text-[10px] font-bold text-white">{getInitials(lead.name)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{lead.name}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(lead)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  {lead.status !== 'Converted' && (
                    <DropdownMenuItem onClick={() => onConvert(lead)}><ArrowRightLeft className="h-4 w-4 mr-2" />Convert</DropdownMenuItem>
                  )}
                  {lead.status !== 'Lost' && lead.status !== 'Converted' && (
                    <DropdownMenuItem onClick={() => onMarkLost(lead)}><XCircle className="h-4 w-4 mr-2" />Mark Lost</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(lead)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span>{lead.area}</span></div>
              <div className="flex items-center gap-1"><Droplets className="h-3 w-3" /><span className="font-medium text-gray-700 dark:text-gray-300">{formatQty(lead.expectedQty)}</span></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${sourceBadgeClasses(lead.source)}`}>{lead.source}</Badge>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Drag Overlay Card ──────────────────────────────────

function DragOverlayCard({ lead }: { lead: Lead }) {
  const stage = getStageConfig(lead.status)
  return (
    <div className={`border ${stage.cardBorder} bg-white dark:bg-gray-900 rounded-xl shadow-2xl rotate-2 scale-105 w-[280px] p-3`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(lead.status)} shrink-0`}>
          <span className="text-[10px] font-bold text-white">{getInitials(lead.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{lead.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lead.phone}</p>
        </div>
      </div>
    </div>
  )
}

// ── Kanban Column (Desktop) ────────────────────────────

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
  const StageIcon = stage.icon

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'column', status: stage.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[290px] w-[290px] lg:min-w-[310px] lg:w-[310px] shrink-0 rounded-xl transition-colors duration-200 ${
        isOver ? `${stage.lightBg} ring-2 ring-inset ${stage.overRing}` : ''
      }`}
    >
      {/* Column header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stage.badgeBg}`}>
              <StageIcon className="h-3.5 w-3.5" />
            </div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{stage.label}</h3>
            <Badge variant="secondary" className={`h-5 min-w-[20px] px-1.5 text-[10px] ${stage.badgeBg} ${stage.badgeText} border-0`}>
              {leads.length}
            </Badge>
          </div>
          {totalQty > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{totalQty}L/day</span>
          )}
        </div>
        <div className={`h-0.5 rounded-full ${stage.bgClass} opacity-30`} />
      </div>

      {/* Cards */}
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-340px)] pr-0.5 custom-scrollbar">
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">No leads here</p>
              {isOver && <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500">Drop here</p>}
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

// ── Mobile Lead Card ───────────────────────────────────

function MobileLeadCard({
  lead,
  onTap,
}: {
  lead: Lead
  onTap: (lead: Lead) => void
}) {
  const stage = getStageConfig(lead.status)

  return (
    <button
      onClick={() => onTap(lead)}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 hover:border-gray-200 dark:hover:border-gray-700 active:scale-[0.98] transition-all duration-150 shadow-sm"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(lead.status)} shrink-0 shadow-sm`}>
          <span className="text-xs font-bold text-white">{getInitials(lead.name)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{lead.name}</h4>
            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.phone}</span>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between mt-2.5 pl-14">
        <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            <span className="truncate max-w-[100px]">{lead.area}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{formatQty(lead.expectedQty)}</span>
          </div>
        </div>
        <Badge className={`text-[10px] px-2 py-0.5 h-5 border-0 rounded-full ${getStageColor(lead.status)}`}>
          {lead.status}
        </Badge>
      </div>
    </button>
  )
}

// ── Pipeline Progress Bar (Mobile) ─────────────────────

function PipelineProgressBar({ leadsByStatus, total }: { leadsByStatus: Record<string, Lead[]>; total: number }) {
  if (total === 0) return null

  const segments = PIPELINE_STAGES.map((stage) => ({
    id: stage.id,
    count: (leadsByStatus[stage.id] || []).length,
    bgClass: stage.bgClass,
    label: stage.label,
  }))

  return (
    <div className="px-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 gap-0.5">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.id}
              className={`${seg.bgClass} rounded-full transition-all duration-500`}
              style={{ width: `${(seg.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        {segments.map((seg) => (
          <div key={seg.id} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${seg.bgClass}`} />
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────

export default function LeadsPage() {
  const isMobile = useIsMobile()

  // State
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])

  // Mobile-specific state
  const [mobileStageFilter, setMobileStageFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useEffect(() => {
    async function fetchAreas() {
      try {
        const res = await fetch('/api/areas')
        if (res.ok) { const data = await res.json(); setAreas(Array.isArray(data) ? data : []) }
      } catch { /* ignore */ }
    }
    fetchAreas()
  }, [])

  // ── Filtered leads ──────────────────────────────────

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (sourceFilter && sourceFilter !== 'all' && lead.source !== sourceFilter) return false
      if (isMobile && mobileStageFilter !== 'all' && lead.status !== mobileStageFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return lead.name.toLowerCase().includes(q) || lead.phone.toLowerCase().includes(q)
    })
  }, [leads, searchQuery, sourceFilter, mobileStageFilter, isMobile])

  // ── Group leads by status ──────────────────────────

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    for (const stage of PIPELINE_STAGES) { grouped[stage.id] = [] }
    for (const lead of filteredLeads) {
      if (!grouped[lead.status]) grouped[lead.status] = []
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
    const activeLeads = filteredLeads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length
    return { total, converted, conversionRate, totalQty, activeLeads }
  }, [filteredLeads])

  // ── DnD handlers ───────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id)
    if (lead) setActiveLead(lead)
  }

  function handleDragOver(_event: DragOverEvent) {}

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveLead(null)
    if (!over) return

    const leadId = active.id as string
    const currentLead = leads.find((l) => l.id === leadId)
    if (!currentLead) return

    let targetStatus: string | null = null
    const overId = over.id as string
    if (PIPELINE_STAGES.some((s) => s.id === overId)) {
      targetStatus = overId
    } else {
      const overLead = leads.find((l) => l.id === overId)
      if (overLead) targetStatus = overLead.status
    }

    if (!targetStatus || targetStatus === currentLead.status) return
    if (targetStatus === 'Converted') { setConvertLead(currentLead); return }

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus! } : l)))
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: targetStatus }) })
      if (!res.ok) throw new Error()
      toast.success(`${currentLead.name} moved to ${targetStatus}`)
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: currentLead.status } : l)))
      toast.error('Failed to update lead status')
    }
  }

  function handleDragCancel() { setActiveLead(null) }

  // ── Mobile: change lead status ─────────────────────

  async function handleMobileStatusChange(lead: Lead, newStatus: string) {
    if (newStatus === 'Converted') { setConvertLead(lead); setDetailOpen(false); return }

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)))
    setSelectedLead((prev) => prev && prev.id === lead.id ? { ...prev, status: newStatus } : prev)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      if (!res.ok) throw new Error()
      toast.success(`${lead.name} moved to ${newStatus}`)
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)))
      setSelectedLead((prev) => prev && prev.id === lead.id ? { ...prev, status: lead.status } : prev)
      toast.error('Failed to update status')
    }
  }

  // ── Form handlers ────────────────────────────────────

  function openAddForm() { setEditingLead(null); setFormData(EMPTY_FORM); setFormOpen(true) }

  function openEditForm(lead: Lead) {
    setEditingLead(lead)
    setFormData({ name: lead.name, phone: lead.phone, area: lead.area, address: lead.address, expectedQty: lead.expectedQty, source: lead.source, notes: lead.notes })
    setFormOpen(true)
    if (isMobile) setDetailOpen(false)
  }

  function closeForm() { setFormOpen(false); setEditingLead(null); setFormData(EMPTY_FORM) }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.area) {
      toast.error('Name, phone, and area are required')
      return
    }
    setSubmitting(true)
    try {
      if (editingLead) {
        const res = await fetch(`/api/leads/${editingLead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        if (!res.ok) throw new Error()
        toast.success('Lead updated successfully')
      } else {
        const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
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
      const res = await fetch(`/api/leads/${convertLead.id}/convert`, { method: 'POST' })
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to convert lead') }
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
      const res = await fetch(`/api/leads/${deleteLead.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Lead deleted successfully')
      setDeleteLead(null)
      setDetailOpen(false)
      fetchLeads()
    } catch {
      toast.error('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  // ── Mark Lost handler ────────────────────────────────

  async function handleMarkLost(lead: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: 'Lost' } : l)))
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Lost' }) })
      if (!res.ok) throw new Error()
      toast.success(`${lead.name} marked as Lost`)
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)))
      toast.error('Failed to update lead status')
    }
  }

  // ── Open lead detail ────────────────────────────────

  function openLeadDetail(lead: Lead) {
    setSelectedLead(lead)
    setDetailOpen(true)
  }

  // ── Next/Prev stage for mobile ──────────────────────

  const getNextStage = (status: string): string | null => {
    const idx = PIPELINE_STAGES.findIndex(s => s.id === status)
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 2) return null // Don't auto-suggest Lost
    return PIPELINE_STAGES[idx + 1].id
  }

  // ── Render ───────────────────────────────────────────

  // ── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isMobile ? 'pb-20' : 'space-y-4 md:space-y-5'}>
      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm shrink-0">
            <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">Leads</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">Track & manage your sales pipeline</p>
          </div>
        </div>
        <Button onClick={openAddForm} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm shrink-0 h-10 md:h-auto px-4 rounded-xl">
          <Plus className="h-4 w-4 md:mr-1.5" />
          <span className="md:inline">Add</span>
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE LAYOUT
          ══════════════════════════════════════════════════════════ */}
      {isMobile && (
        <div className="space-y-3">
          {/* Mobile Stats - Compact inline */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">leads</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/50 rounded-lg px-2.5 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-bold text-green-700">{stats.conversionRate}%</span>
              <span className="text-[10px] text-green-500">rate</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg px-2.5 py-1.5">
              <Droplets className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">{stats.totalQty}L</span>
              <span className="text-[10px] text-blue-500">daily</span>
            </div>
          </div>

          {/* Pipeline Progress Bar */}
          <PipelineProgressBar leadsByStatus={leadsByStatus} total={stats.total} />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
            />
            {(searchQuery || sourceFilter !== 'all' || areaFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setSourceFilter('all'); setAreaFilter('all') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Stage Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
            <button
              onClick={() => setMobileStageFilter('all')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 min-h-[40px] transition-all ${mobileStageFilter === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
            >
              <Layers className="h-3.5 w-3.5" />
              All
              <span className={`ml-0.5 text-[10px] ${mobileStageFilter === 'all' ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>{stats.total}</span>
            </button>
            {PIPELINE_STAGES.map((stage) => {
              const count = (leadsByStatus[stage.id] || []).length
              const StageIcon = stage.icon
              return (
                <button
                  key={stage.id}
                  onClick={() => setMobileStageFilter(stage.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 min-h-[40px] transition-all ${mobileStageFilter === stage.id ? `${stage.badgeBg} ${stage.badgeText} border border-transparent shadow-sm` : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700'}`}
                >
                  <StageIcon className="h-3.5 w-3.5" />
                  {stage.label}
                  {count > 0 && <span className={`ml-0.5 text-[10px] ${mobileStageFilter === stage.id ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>}
                </button>
              )
            })}
          </div>

          {/* Filter button row */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg text-xs gap-1.5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {(areaFilter !== 'all' || sourceFilter !== 'all') && (
                <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-green-600 text-white border-0 rounded-full">{(areaFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0)}</Badge>
              )}
            </Button>
            {(areaFilter !== 'all' || sourceFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-500 dark:text-gray-400" onClick={() => { setAreaFilter('all'); setSourceFilter('all') }}>Clear</Button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Area</Label>
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger className="w-full h-10 text-xs rounded-lg"><SelectValue placeholder="All Areas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {areas.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Source</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full h-10 text-xs rounded-lg"><SelectValue placeholder="All Sources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Lead List */}
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 mb-4">
                <UserPlus className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">No leads found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
                {searchQuery || areaFilter !== 'all' || sourceFilter !== 'all' || mobileStageFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first lead to get started'}
              </p>
              {!searchQuery && areaFilter === 'all' && sourceFilter === 'all' && mobileStageFilter === 'all' && (
                <Button onClick={openAddForm} className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl h-11 px-6 shadow-sm">
                  <Plus className="h-4 w-4 mr-1.5" />Add Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <MobileLeadCard key={lead.id} lead={lead} onTap={openLeadDetail} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          ══════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <>
          {/* Desktop Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: Users, label: 'Total Leads', value: stats.total, color: 'gray', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
              { icon: TrendingUp, label: 'Conversion', value: `${stats.conversionRate}%`, color: 'green', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
              { icon: Layers, label: 'Active', value: stats.activeLeads, color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
              { icon: Droplets, label: 'Daily Qty', value: `${stats.totalQty}L`, color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300' },
              { icon: CheckCircle2, label: 'Converted', value: stats.converted, color: 'green', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
            ].map((stat) => (
              <Card key={stat.label} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-3.5 w-3.5 ${stat.text}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${stat.text} ml-9`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Filters */}
          <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input placeholder="Search name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-3.5 w-3.5" />Filters
                  {(areaFilter !== 'all' || sourceFilter !== 'all') && (
                    <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-green-600 text-white border-0">{(areaFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0)}</Badge>
                  )}
                </Button>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{filteredLeads.length}</span> leads
                </div>
              </div>
              {showFilters && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Area:</span>
                      <Select value={areaFilter} onValueChange={setAreaFilter}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="All Areas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Areas</SelectItem>
                          {areas.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Source:</span>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="All Sources" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {(areaFilter !== 'all' || sourceFilter !== 'all') && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500 dark:text-gray-400" onClick={() => { setAreaFilter('all'); setSourceFilter('all') }}>Clear</Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Desktop Kanban Board */}
          {filteredLeads.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-horizontal">
                {PIPELINE_STAGES.map((stage) => (
                  <DroppableKanbanColumn key={stage.id} stage={stage} leads={leadsByStatus[stage.id] || []} onEdit={openEditForm} onConvert={(lead) => setConvertLead(lead)} onMarkLost={handleMarkLost} onDelete={(lead) => setDeleteLead(lead)} />
                ))}
              </div>
              <DragOverlay>
                {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="flex h-64 flex-col items-center justify-center gap-3 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <UserPlus className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-gray-100">No leads found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your first lead to get started</p>
                </div>
                <Button onClick={openAddForm} className="mt-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-1.5" />Add Lead
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          SHARED DIALOGS
          ══════════════════════════════════════════════════════════ */}

      {/* ── Mobile Lead Detail Sheet ───────────────────── */}
      {isMobile && (
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto px-0">
            {selectedLead && (
              <div className="px-5 pb-8">
                <SheetHeader className="pb-4">
                  <SheetTitle className="sr-only">Lead Details</SheetTitle>
                </SheetHeader>

                {/* Lead Header */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(selectedLead.status)} shrink-0 shadow-md`}>
                    <span className="text-base font-bold text-white">{getInitials(selectedLead.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{selectedLead.name}</h3>
                    <Badge className={`mt-1 text-[11px] px-2.5 py-0.5 h-6 border-0 rounded-full ${getStageColor(selectedLead.status)}`}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selectedLead.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <Droplets className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Daily Qty</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatQty(selectedLead.expectedQty)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Area</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selectedLead.area}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Added</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedLead.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Source & Address */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Source</span>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 h-6 ${sourceBadgeClasses(selectedLead.source)}`}>{selectedLead.source}</Badge>
                  </div>
                  {selectedLead.address && (
                    <div>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Address</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedLead.address}</p>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Move to Stage */}
                {selectedLead.status !== 'Converted' && selectedLead.status !== 'Lost' && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Move to Stage</p>
                    <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
                      {PIPELINE_STAGES.filter(s => s.id !== selectedLead.status).map((stage) => {
                        const StageIcon = stage.icon
                        return (
                          <button
                            key={stage.id}
                            onClick={() => handleMobileStatusChange(selectedLead, stage.id)}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all ${stage.badgeBg} ${stage.badgeText} border border-transparent active:scale-95`}
                          >
                            <StageIcon className="h-3.5 w-3.5" />
                            {stage.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Advance Button */}
                {getNextStage(selectedLead.status) && (() => {
                  const nextStage = getStageConfig(getNextStage(selectedLead.status)!)
                  const NextIcon = nextStage.icon
                  return (
                    <button
                      onClick={() => handleMobileStatusChange(selectedLead, getNextStage(selectedLead.status)!)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 mb-3 font-semibold text-sm transition-all active:scale-[0.98] ${nextStage.lightBg} ${nextStage.textClass} border ${nextStage.cardBorder}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Move to {getNextStage(selectedLead.status)}
                      <NextIcon className="h-4 w-4" />
                    </button>
                  )
                })()}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl text-sm font-medium border-gray-200 dark:border-gray-700"
                    onClick={() => openEditForm(selectedLead)}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  {selectedLead.status !== 'Converted' && (
                    <Button
                      className="h-12 rounded-xl text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
                      onClick={() => { setConvertLead(selectedLead); setDetailOpen(false) }}
                    >
                      <UserCheck className="h-4 w-4 mr-1.5" />
                      Convert
                    </Button>
                  )}
                  {selectedLead.status !== 'Lost' && selectedLead.status !== 'Converted' && (
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl text-sm font-medium border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => { handleMarkLost(selectedLead); setDetailOpen(false) }}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Mark Lost
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl text-sm font-medium border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => { setDeleteLead(selectedLead); setDetailOpen(false) }}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* ── Add/Edit Lead Dialog ─────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className={`sm:max-w-[520px] p-0 gap-0 overflow-hidden ${isMobile ? '!top-0 !left-0 !translate-x-0 !translate-y-0 w-screen h-[100dvh] max-w-none rounded-none' : 'max-h-[90vh] rounded-xl'}`}>
          <div className={`flex flex-col ${isMobile ? 'h-full' : 'max-h-[90vh]'}`}>
            {/* Header - always visible */}
            <div className="shrink-0 px-5 pt-5 pb-3 sm:px-6 sm:pt-6 border-b border-gray-100 dark:border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-lg">{editingLead ? 'Edit Lead' : 'New Lead'}</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingLead ? 'Update the lead information' : 'Fill in the details for the new lead'}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="grid gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-name" className="text-sm">Name <span className="text-red-500">*</span></Label>
                    <Input id="lead-name" placeholder="Full name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-phone" className="text-sm">Phone <span className="text-red-500">*</span></Label>
                    <Input id="lead-phone" placeholder="Phone number" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-area" className="text-sm">Area <span className="text-red-500">*</span></Label>
                    <Select value={formData.area} onValueChange={(v) => setFormData((p) => ({ ...p, area: v }))}>
                      <SelectTrigger id="lead-area" className="w-full h-11 rounded-xl"><SelectValue placeholder="Select area" /></SelectTrigger>
                      <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-source" className="text-sm">Source</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData((p) => ({ ...p, source: v }))}>
                      <SelectTrigger id="lead-source" className="w-full h-11 rounded-xl"><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-address" className="text-sm">Address</Label>
                  <Input id="lead-address" placeholder="Delivery address" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-qty" className="text-sm">Daily Qty (L)</Label>
                  <Input id="lead-qty" type="number" min={0} step={0.5} placeholder="0" value={formData.expectedQty || ''} onChange={(e) => setFormData((p) => ({ ...p, expectedQty: parseFloat(e.target.value) || 0 }))} className="h-11 rounded-xl max-w-[160px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-notes" className="text-sm">Notes</Label>
                  <Textarea id="lead-notes" placeholder="Additional notes..." rows={3} value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Footer - always visible */}
            <div className="shrink-0 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <DialogFooter className="flex-row gap-2.5">
                <Button variant="outline" onClick={closeForm} disabled={submitting} className="flex-1 h-12 rounded-xl">Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Convert Confirmation ────────────────────────── */}
      <Dialog open={!!convertLead} onOpenChange={(open) => !open && setConvertLead(null)}>
        <DialogContent className={`sm:max-w-[420px] ${isMobile ? 'rounded-2xl mx-4 max-w-[calc(100%-2rem)]' : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              Convert to Customer
            </DialogTitle>
            <DialogDescription>
              Convert <span className="font-semibold text-gray-900 dark:text-gray-100">{convertLead?.name}</span> to a customer? This will create a new customer record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2.5">
            <Button variant="outline" onClick={() => setConvertLead(null)} disabled={converting} className={`flex-1 ${isMobile ? 'h-12 rounded-xl' : ''}`}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting} className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm ${isMobile ? 'h-12 rounded-xl' : ''}`}>
              {converting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────── */}
      <AlertDialog open={!!deleteLead} onOpenChange={(open) => !open && setDeleteLead(null)}>
        <AlertDialogContent className={isMobile ? 'rounded-2xl mx-4 max-w-[calc(100%-2rem)]' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2.5">
            <AlertDialogCancel disabled={deleting} className={`flex-1 ${isMobile ? 'h-12 rounded-xl' : ''}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className={`flex-1 bg-red-600 hover:bg-red-700 text-white ${isMobile ? 'h-12 rounded-xl' : ''}`}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
