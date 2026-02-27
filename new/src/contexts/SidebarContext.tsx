import { createContext, useContext, ReactNode } from 'react'

interface SidebarContextType {
  isSidebarCollapsed: boolean
  navWidth: number
  onSearchSubmit: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
  children,
  isSidebarCollapsed,
  navWidth,
  onSearchSubmit,
}: {
  children: ReactNode
  isSidebarCollapsed: boolean
  navWidth: number
  onSearchSubmit: () => void
}) {
  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, navWidth, onSearchSubmit }}>
      {children}
    </SidebarContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
