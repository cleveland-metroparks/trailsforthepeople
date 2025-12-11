import { createContext, useContext, ReactNode } from 'react'

interface SidebarContextType {
  isSidebarCollapsed: boolean
  onSearchSubmit: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
  children,
  isSidebarCollapsed,
  onSearchSubmit,
}: {
  children: ReactNode
  isSidebarCollapsed: boolean
  onSearchSubmit: () => void
}) {
  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, onSearchSubmit }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
