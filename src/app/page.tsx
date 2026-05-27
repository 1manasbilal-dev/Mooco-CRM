'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
import { useTheme } from 'next-themes'
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
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
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
  { id: 'leads', label: 'Leads', icon: UserPlus, desc: 'Sales pipeline & lead tracking' },
  { id: 'inventory', label: 'Inventory', icon: Package, desc: 'Products & daily sales' },
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
  const { data: session } = useSession()
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  const userRole = (session?.user as any)?.role || 'USER';
  const userPermissions = (session?.user as any)?.permissions || ['dashboard'];

  const allowedNavItems = navItems.filter(item => {
    if (userRole === 'SUPER_ADMIN') return true;
    return userPermissions.includes(item.id);
  });

  const showMoreMobile = allowedNavItems.length > 5;
  const mobilePrimaryNavItems = showMoreMobile
    ? [
        ...allowedNavItems.slice(0, 4),
        { id: 'more', label: 'More', icon: MoreHorizontal }
      ]
    : allowedNavItems;

  const mobileMoreNavItems = showMoreMobile
    ? allowedNavItems.slice(4)
    : [];

  const getTabDescription = (id: string) => {
    switch (id) {
      case 'leads': return 'Sales pipeline & lead tracking';
      case 'inventory': return 'Products & daily sales';
      case 'settings': return 'Shop configuration';
      case 'customers': return 'Manage customers list';
      case 'deliveries': return 'Track deliveries';
      case 'payments': return 'Manage billing & history';
      default: return '';
    }
  };

  // Redirect to dashboard if no permission for active page
  useEffect(() => {
    if (mounted && session?.user) {
      const role = (session.user as any).role || 'USER';
      const permissions = (session.user as any).permissions || ['dashboard'];
      if (role !== 'SUPER_ADMIN' && !permissions.includes(activePage)) {
        setActivePage('dashboard');
      }
    }
  }, [activePage, session, mounted, setActivePage]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  useEffect(() => { setMounted(true) }, []) // eslint-disable-line react-hooks/set-state-in-effect

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
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-gray-950">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      {!isMobile && (
        <aside className={"hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800 transition-all duration-300 ease-in-out shrink-0 " + (sidebarOpen ? "w-[260px]" : "w-[72px]")}>
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight">DairyFlow</h1>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">Fresh Milk. Smart Delivery.</p>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {allowedNavItems.map((item) => {
              const isActive = activePage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer " + (isActive ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-300")}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={"h-5 w-5 shrink-0 " + (isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300")} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-green-500 dark:text-green-400" />}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1 shrink-0">
            {mounted && sidebarOpen && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0 text-amber-400" /> : <Moon className="h-5 w-5 shrink-0" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}
            {mounted && !sidebarOpen && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center w-full rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            {sidebarOpen ? (
              <p className="text-[11px] text-gray-300 dark:text-gray-600 px-3">v1.0 · DairyFlow</p>
            ) : (
              <p className="text-center text-[11px] text-gray-300 dark:text-gray-600">v1</p>
            )}
          </div>
        </aside>
      )}

      {/* ── Main Content Area ───────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Header */}
        {!isMobile && (
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-6">
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 hidden lg:block">{currentPageLabel}</h2>
            <div className="relative flex-1 max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search anything..."
                className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-200 dark:placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {mounted && (
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-500" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl relative">
              <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-9 rounded-xl shadow-sm px-4">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add New</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setActivePage('leads')}><UserPlus className="mr-2 h-4 w-4" />Add Lead</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActivePage('customers')}><Users className="mr-2 h-4 w-4" />Add Customer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActivePage('payments')}><Wallet className="mr-2 h-4 w-4" />Record Payment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 shrink-0 cursor-pointer ring-2 ring-gray-100 dark:ring-gray-800">
                  <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-400 text-xs font-bold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="flex flex-col gap-1 p-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logged in as</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px] font-bold border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5">
                      {(session?.user as any)?.role || "USER"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-500 focus:text-red-500 cursor-pointer">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <header className="flex h-14 shrink-0 items-center gap-3 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800 px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50 flex-1 truncate">{currentPageLabel}</h2>
            {mounted && (
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-500" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
              {mobileSearchOpen ? <X className="h-4 w-4 dark:text-gray-300" /> : <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 relative">
              <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
          </header>
        )}

        {/* Mobile Search */}
        {isMobile && mobileSearchOpen && (
          <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Search..." className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-200 dark:placeholder:text-gray-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className={"flex-1 overflow-y-auto " + (isMobile ? "pb-20" : "p-4 lg:p-6")}>
          <div className={isMobile ? "p-4" : ""}>
            <ActivePageComponent />
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ────────────────────────── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-gray-800">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
            {mobilePrimaryNavItems.map((item) => {
              const isActive = item.id === 'more' 
                ? !mobilePrimaryNavItems.some(nav => nav.id === activePage)
                : activePage === item.id;
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={"flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px] cursor-pointer " + (isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}
                >
                  <div className={"flex items-center justify-center rounded-xl transition-all duration-200 h-8 w-8 " + (isActive ? "bg-green-50 dark:bg-green-950/40" : "")}>
                    <Icon className={"h-5 w-5 " + (isActive ? "text-green-600 dark:text-green-400" : "")} />
                  </div>
                  <span className={"text-[10px] font-medium leading-tight " + (isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* ── More Sheet ──────────────────────────────────────── */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[420px] dark:bg-gray-900 dark:border-gray-800">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-lg dark:text-gray-50">More Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {mobileMoreNavItems.map((item) => {
              const isActive = activePage === item.id
              const Icon = item.icon
              const desc = getTabDescription(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => handleMoreNavClick(item.id)}
                  className={"flex items-center gap-4 w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200 cursor-pointer " + (isActive ? "bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent")}
                >
                  <div className={"flex h-11 w-11 items-center justify-center rounded-xl shrink-0 " + (isActive ? "bg-green-100 dark:bg-green-900/50" : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600")}>
                    <Icon className={"h-5 w-5 " + (isActive ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={"text-sm font-semibold " + (isActive ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-gray-100")}>{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {isActive && <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-0 text-xs shrink-0">Active</Badge>}
                </button>
              )
            })}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Quick Actions</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setActivePage('leads'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900 py-3 px-2 active:bg-green-100 dark:active:bg-green-900/50 transition-colors">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" /><span className="text-[11px] font-medium text-green-700 dark:text-green-300">Add Lead</span>
                </button>
                <button onClick={() => { setActivePage('customers'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 py-3 px-2 active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /><span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Customer</span>
                </button>
                <button onClick={() => { setActivePage('payments'); setMoreSheetOpen(false) }} className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 py-3 px-2 active:bg-amber-100 dark:active:bg-amber-900/50 transition-colors">
                  <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" /><span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Payment</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
