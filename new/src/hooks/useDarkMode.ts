import { useSidebar } from '../contexts/SidebarContext'

const DARK_MODE_MOBILE = import.meta.env.VITE_DARK_MODE_MOBILE === 'true'
const DARK_MODE_DESKTOP = import.meta.env.VITE_DARK_MODE_DESKTOP === 'true'

export function useDarkMode(): boolean {
  const { isMobile } = useSidebar()
  return (isMobile && DARK_MODE_MOBILE) || (!isMobile && DARK_MODE_DESKTOP)
}
