import { create } from 'zustand'

interface AppState {
  activePage: string
  sidebarOpen: boolean
  searchQuery: string
  setActivePage: (page: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  searchQuery: '',
  setActivePage: (page) => set({ activePage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
