'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Package,
  Settings,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  Droplets,
} from 'lucide-react'
import DashboardPage from '@/components/pages/dashboard-page'
import LeadsPage from '@/components/pages/leads-page'
import CustomersPage from '@/components/pages/customers-page'
import DeliveriesPage from '@/components/pages/deliveries-page'
import PaymentsPage from '@/components/pages/payments-page'
import ReportsPage from '@/components/pages/reports-page'
import InventoryPage from '@/components/pages/inventory-page'
import SettingsPage from '@/components/pages/settings-page'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  leads: LeadsPage,
  customers: CustomersPage,
  deliveries: DeliveriesPage,
  payments: PaymentsPage,
  reports: ReportsPage,
  inventory: InventoryPage,
  settings: SettingsPage,
}

export default function Home() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useAppStore()
  const [today] = useState(() => {
    const d = new Date()
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setSidebarOpen])

  const ActivePageComponent = pageComponents[activePage] || DashboardPage

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[260px] translate-x-0' : isMobile ? '-translate-x-full w-[260px]' : 'w-[72px] translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">DairyFlow</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Fresh Milk. Smart Delivery.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                  transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Version */}
        <div className="border-t border-gray-100 px-4 py-3">
          {sidebarOpen ? (
            <p className="text-xs text-gray-300">v1.0</p>
          ) : (
            <p className="text-center text-[10px] text-gray-300">v1</p>
          )}
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className={`
          flex flex-1 flex-col overflow-hidden transition-all duration-300
          ${sidebarOpen ? (isMobile ? 'ml-0' : 'ml-[260px]') : isMobile ? 'ml-0' : 'ml-[72px]'}
        `}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Desktop sidebar toggle */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search customers, deliveries..."
              className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="hidden lg:block text-sm text-gray-500 whitespace-nowrap">
            {today}
          </div>

          {/* Notification bell */}
          <Button variant="ghost" size="icon" className="relative shrink-0">
            <Bell className="h-5 w-5 text-gray-500" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-500 text-white text-[10px] border-0">
              3
            </Badge>
          </Button>

          {/* Add New dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white h-9 rounded-lg">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setActivePage('leads')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePage('customers')}>
                <Users className="mr-2 h-4 w-4" />
                Add Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActivePage('payments')}>
                <Wallet className="mr-2 h-4 w-4" />
                Record Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <Avatar className="h-8 w-8 shrink-0 bg-green-100 cursor-pointer">
            <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
              AK
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ActivePageComponent />
        </main>
      </div>
    </div>
  )
}
