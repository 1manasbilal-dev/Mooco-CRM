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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Truck,
  Wallet,
  Package,
  Settings,
  Search,
  Bell,
  Plus,
  Menu,
  Droplets,
  MoreHorizontal,
  X,
} from 'lucide-react'
import DashboardPage from '@/components/pages/dashboard-page'
import LeadsPage from '@/components/pages/leads-page'
import CustomersPage from '@/components/pages/customers-page'
import DeliveriesPage from '@/components/pages/deliveries-page'
import PaymentsPage from '@/components/pages/payments-page'
import InventoryPage from '@/components/pages/inventory-page'
import SettingsPage from '@/components/pages/settings-page'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const primaryNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'more', label: 'More', icon: MoreHorizontal },
]

const moreNavItems = [
  { id: 'leads', label: 'Leads', icon: UserPlus, desc: 'Sales pipeline and lead tracking' },
  { id: 'inventory', label: 'Inventory', icon: Package, desc: 'Products and daily sales' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Shop configuration' },
]

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  leads: LeadsPage,
  customers: CustomersPage,
  deliveries: DeliveriesPage,
  payments: PaymentsPage,
  inventory: InventoryPage,
  settings: SettingsPage,
}

export default function DairyFlowApp() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useAppStore()
  const isMobileState = useState(false)
  const isMobile = isMobileState[0]
  const setIsMobile = isMobileState[1]
  const mobileSearchState = useState(false)
  const mobileSearchOpen = mobileSearchState[0]
  const setMobileSearchOpen = mobileSearchState[1]
  const moreSheetState = useState(false)
  const moreSheetOpen = moreSheetState[0]
  const setMoreSheetOpen = moreSheetState[1]

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const ActivePageComponent = pageComponents[activePage] || DashboardPage

  const handleNavClick = (pageId: string) => {
    if (pageId === 'more') {
      setMoreSheetOpen(true)
      return
    }
    setActivePage(pageId)
    if (isMobile) setSidebarOpen(false)
  }

  const handleMoreNavClick = (pageId: string) => {
    setActivePage(pageId)
    setMoreSheetOpen(false)
  }

  const currentPageLabel = navItems.find(n => n.id === activePage)?.label || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/80">
      {!isMobile && (
        <aside className={"hidden md:flex flex-col bg-white border-r border-gray-200/80 transition-all duration-300 ease-in-out shrink-0 " + (sidebarOpen ? "w-64" : "w-18")}>
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">DairyFlow</h1>
                <p className="text-xs text-gray-400 leading-tight">Fresh Milk. Smart Delivery.</p>
              </div>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => handleNavClick(item.id)} className={"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer " + (isActive ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700")} title={!sidebarOpen ? item.label : undefined}>
                  <Icon className={"h-5 w-5 shrink-0 " + (isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-600")} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
          <div className="border-t border-gray-100 px-4 py-3">
            {sidebarOpen ? <p className="text-xs text-gray-300">v1.0</p> : <p className="text-center text-xs text-gray-300">v1</p>}
          </div>
        </aside>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isMobile && (
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-sm px-6">
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </Button>
            <h2 className="text-base font-semibold text-gray-800 hidden lg:block">{currentPageLabel}</h2>
            <div className="relative flex-1 max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" className="relative shrink-0 h-9 w-9">
              <Bell className="h-4 w-4 text-gray-500" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-green-500 text-white text-xs border-0">3</Badge>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-9 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" />Add New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setActivePage('leads')}><UserPlus className="mr-2 h-4 w-4" />Add Lead</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActivePage('customers')}><Users className="mr-2 h-4 w-4" />Add Customer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActivePage('payments')}><Wallet className="mr-2 h-4 w-4" />Record Payment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="h-8 w-8 shrink-0 cursor-pointer">
              <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 text-xs font-semibold">AK</AvatarFallback>
            </Avatar>
          </header>
        )}

        {isMobile && (
          <header className="flex h-14 shrink-0 items-center gap-3 bg-white border-b border-gray-200/80 px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900 flex-1 truncate">{currentPageLabel}</h2>
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
              {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4 text-gray-500" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative shrink-0 h-9 w-9">
              <Bell className="h-4 w-4 text-gray-500" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-green-500 text-white text-xs border-0">3</Badge>
            </Button>
          </header>
        )}

        {isMobile && mobileSearchOpen && (
          <div className="px-4 py-2 bg-white border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            </div>
          </div>
        )}

        <main className={"flex-1 overflow-y-auto " + (isMobile ? "pb-20" : "p-4 lg:p-6")}>
          <div className={isMobile ? "p-4" : ""}>
            <ActivePageComponent />
          </div>
        </main>
      </div>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-lg">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {primaryNavItems.map((item) => {
              const isActive = item.id === 'more' ? ("leads inventory settings".indexOf(activePage) >= 0) : activePage === item.id
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => handleNavClick(item.id)} className={"flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 min-w-14 cursor-pointer " + (isActive ? "text-green-600" : "text-gray-400")}>
                  <div className={"flex items-center justify-center rounded-xl transition-all duration-200 h-8 w-8 " + (isActive ? "bg-green-50" : "")}>
                    <Icon className={"h-5 w-5 " + (isActive ? "text-green-600" : "")} />
                  </div>
                  <span className={"text-xs font-medium leading-tight " + (isActive ? "text-green-600" : "text-gray-400")}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-96">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">More Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-8">
            {moreNavItems.map((item) => {
              const isActive = activePage === item.id
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => handleMoreNavClick(item.id)} className={"flex items-center gap-4 w-full rounded-2xl px-4 py-3.5 text-left transition-all duration-200 cursor-pointer " + (isActive ? "bg-green-50 border border-green-200" : "bg-gray-50 hover:bg-gray-100 border border-transparent")}>
                  <div className={"flex h-11 w-11 items-center justify-center rounded-xl shrink-0 " + (isActive ? "bg-green-100" : "bg-white border border-gray-200")}>
                    <Icon className={"h-5 w-5 " + (isActive ? "text-green-600" : "text-gray-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={"text-sm font-semibold " + (isActive ? "text-green-700" : "text-gray-900")}>{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  {isActive && <Badge className="bg-green-100 text-green-700 border-0 text-xs shrink-0">Active</Badge>}
                </button>
              )
            })}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">Quick Actions</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setActivePage('leads'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-green-50 border border-green-100 py-3 px-2 active:bg-green-100 transition-colors">
                  <UserPlus className="h-5 w-5 text-green-600" /><span className="text-xs font-medium text-green-700">Add Lead</span>
                </button>
                <button onClick={() => { setActivePage('customers'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 py-3 px-2 active:bg-blue-100 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" /><span className="text-xs font-medium text-blue-700">Customer</span>
                </button>
                <button onClick={() => { setActivePage('payments'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 py-3 px-2 active:bg-amber-100 transition-colors">
                  <Wallet className="h-5 w-5 text-amber-600" /><span className="text-xs font-medium text-amber-700">Payment</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
