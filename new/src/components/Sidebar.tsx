import { Tabs, Loader, Center, ActionIcon, Box, Text, Divider, UnstyledButton } from '@mantine/core'
import { Search, Share, InfoCircle, Tree, Walk, Flag3, Bug, ChevronLeft, Menu2, Route, ChevronDown } from 'tabler-icons-react'
import { PanelCloseButton } from './PanelCloseButton'
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, Suspense, lazy, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useURLState } from '../hooks/useURLState'
import { useMapSelection } from '../contexts/MapSelectionContext'
import { useDirections } from '../contexts/DirectionsContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useMap } from '../contexts/MapContext'
import { useMapConfig } from '../hooks/useMapConfig'
import { useParksData } from '../hooks/useParksData'
import { useTrailsData } from '../hooks/useTrailsData'
import { useActivitiesData } from '../hooks/useActivitiesData'
import { NAV_WIDTH_EXPANDED, NAV_WIDTH_COLLAPSED, MOBILE_BOTTOM_BAR_HEIGHT, MOBILE_SHEET_EXPANDED_TOP, MOBILE_SHEET_PEEK_STRIP_HEIGHT, MOBILE_SHEET_PEEKED_HEIGHT } from './sidebarConstants'

const DARK_MODE_MOBILE = import.meta.env.VITE_DARK_MODE_MOBILE === 'true'
const DARK_MODE_DESKTOP = import.meta.env.VITE_DARK_MODE_DESKTOP === 'true'

// Lazy load all panels
const SearchPanel = lazy(() => import('./panels/SearchPanel').then(m => ({ default: m.SearchPanel })))
const SharePanel = lazy(() => import('./panels/SharePanel').then(m => ({ default: m.SharePanel })))
const CreditsPanel = lazy(() => import('./panels/CreditsPanel').then(m => ({ default: m.CreditsPanel })))
const ParksPanel = lazy(() => import('./panels/ParksPanel').then(m => ({ default: m.ParksPanel })))
const ActivitiesPanel = lazy(() => import('./panels/ActivitiesPanel').then(m => ({ default: m.ActivitiesPanel })))
const TrailsPanel = lazy(() => import('./panels/TrailsPanel').then(m => ({ default: m.TrailsPanel })))
const DebugPanel = lazy(() => import('./panels/DebugPanel').then(m => ({ default: m.DebugPanel })))
const DirectionsPanel = lazy(() => import('./panels/DirectionsPanel').then(m => ({ default: m.DirectionsPanel })))

// Sidebar color scheme
const SIDEBAR_COLORS = {
  topSection: {
    background: '#000000',
    text: '#FFFFFF',
    icon: '#A6CE39',
    activeBackground: '#1a1a1a',
  },
  bottomSection: {
    background: '#222124',
    text: '#B2B2B2',
    icon: '#B2B2B2',
    activeBackground: '#333235',
  },
  panel: {
    background: DARK_MODE_DESKTOP ? '#111111' : '#FFFFFF',
    heading: '#000000',
    text: '#000000',
    button: '#6AB03E',
    icon: '#6AB03E',
  },
}

interface SidebarProps {
  onPanelStateChange?: (hasActivePanel: boolean) => void
  onNavExpandedChange?: (isExpanded: boolean) => void
  onActivePanelChange?: (activePanel: string | null) => void
  onSheetExpandedChange?: (isExpanded: boolean) => void
}

export interface SidebarRef {
  activateSearchTab: () => void
  closePanel: () => void
  collapseSheet: () => void
}

/**
 * Map URL feature types to sidebar tab names
 */
function getTabForFeatureType(type: string | null | undefined, activityId: string | null | undefined): string | null {
  if (type === 'park') return 'parks'
  if (type === 'trail') return 'trails'
  if (type === 'attraction' || activityId) return 'activities'
  return null
}

// Loading fallback component
const PanelLoader = () => (
  <Center style={{ flex: 1 }}>
    <Loader size="sm" />
  </Center>
)

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onPanelStateChange, onNavExpandedChange, onActivePanelChange, onSheetExpandedChange }, ref) => {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showDebugTab, setShowDebugTab] = useState(false)
  const [isNavExpanded, setIsNavExpanded] = useState(true)
  type SheetState = 'collapsed' | 'peeked' | 'expanded'
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
  const [directionsTitle, setDirectionsTitle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const { params, setParams } = useURLState()
  const { selectionTick } = useMapSelection()
  const { openRequestId, closeRequestId, isDirectionsLoading } = useDirections()
  const { isMobile } = useSidebar()
  const { map: mapInstance } = useMap()
  const { mapConfig } = useMapConfig()
  const { data: parks } = useParksData()
  const { data: trails } = useTrailsData()
  const { attractions } = useActivitiesData()
  const prevOpenRequestId = useRef(0)
  const prevCloseRequestId = useRef(0)
  const lastFocusedNavTabRef = useRef<HTMLButtonElement | null>(null)
  const panelRootRef = useRef<HTMLDivElement | null>(null)
  const openFromNavRef = useRef(false)
  const startY = useRef(0)
  const lastActiveTab = useRef<string>('parks')
  const isDragGesture = useRef(false)
  const lastTapTime = useRef(0)

  const selectedFeatureTitle = useMemo(() => {
    if (!params.gid) return null
    if (params.type === 'park') return parks?.find(p => String(p.record_id) === params.gid)?.pagetitle ?? null
    if (params.type === 'trail') return trails?.find(t => String(t.id) === params.gid)?.name ?? null
    if (params.type === 'attraction') return attractions.find(a => String(a.gis_id) === params.gid)?.pagetitle ?? null
    return null
  }, [params.type, params.gid, parks, trails, attractions])

  // Track activeTab in a ref so the URL-sync effect can read it without depending on it.
  // This breaks the feedback loop: user tab changes don't re-trigger the URL-sync effect.
  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    onPanelStateChange?.(activeTab !== null)
    onActivePanelChange?.(activeTab)
  }, [activeTab, onPanelStateChange, onActivePanelChange])

  useEffect(() => {
    onSheetExpandedChange?.(sheetState === 'expanded' || sheetState === 'peeked')
  }, [sheetState, onSheetExpandedChange])

  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.removeProperty('--mobile-mapbox-bottom-left')
      return
    }
    // env(safe-area-inset-bottom) handles the home indicator on notched phones.
    // The sheet itself accounts for it via 100dvh; controls floating outside the sheet need it explicitly.
    const sab = 'env(safe-area-inset-bottom, 0px)'
    const bottomCtrl =
      sheetState === 'peeked'    ? `calc(${MOBILE_SHEET_PEEKED_HEIGHT + 16}px + ${sab})` :
      sheetState === 'collapsed' ? `calc(${MOBILE_BOTTOM_BAR_HEIGHT + 16}px + ${sab})`   :
                                   `calc(${MOBILE_SHEET_EXPANDED_TOP}px + ${sab})`
    const bottomLeft =
      sheetState === 'peeked'    ? `calc(${MOBILE_SHEET_PEEKED_HEIGHT}px + ${sab})` :
      sheetState === 'collapsed' ? `calc(${MOBILE_BOTTOM_BAR_HEIGHT}px + ${sab})` :
                                   `calc(${MOBILE_SHEET_EXPANDED_TOP}px + ${sab})`
    document.documentElement.style.setProperty('--mobile-ctrl-bottom', bottomCtrl)
    document.documentElement.style.setProperty('--mobile-mapbox-bottom-left', bottomLeft)
  }, [sheetState, isMobile])

  useEffect(() => {
    onNavExpandedChange?.(isNavExpanded)
  }, [isNavExpanded, onNavExpandedChange])

  // Expose showDebugPanel to the console for developers
  useEffect(() => {
    (window as Window & { showDebugPanel?: () => void }).showDebugPanel = () => {
      setShowDebugTab(true)
      openTab('debug')
    }
    return () => {
      delete (window as Window & { showDebugPanel?: () => void }).showDebugPanel
    }
  }, [])

  const openTab = (tab: string, peek = false) => {
    setActiveTab(tab)
    setSheetState(peek ? 'peeked' : 'expanded')
  }

  const toggleNavExpanded = () => {
    setIsNavExpanded(!isNavExpanded)
  }

  const navWidth = isNavExpanded ? NAV_WIDTH_EXPANDED : NAV_WIDTH_COLLAPSED

  // Open the appropriate panel when a feature is selected via URL or map click.
  // Only runs when URL params or selectionTick change — NOT when activeTab changes.
  // This means user actions (close panel, switch tabs) don't trigger this effect,
  // so there's no feedback loop where the effect fights the user's intent.
  useEffect(() => {
    if (params.fromSearch === 'true' && activeTabRef.current === 'search') {
      // Stay on the search tab; peek when a specific feature is selected
      if (params.type && params.gid) {
        setSheetState('peeked')
      }
      return
    }

    const tabForFeature = getTabForFeatureType(params.type, params.activityId)
    if (tabForFeature) {
      openTab(tabForFeature, !!(params.type && params.gid)) // peek only for specific features, not activity list filters
    } else if (activeTabRef.current === 'search' && !params.type) {
      // Feature cleared while on search tab (e.g. Back from detail) — re-expand to show results
      setSheetState('expanded')
    }
  }, [params.type, params.gid, params.activityId, params.fromSearch, selectionTick])

  // Switch to directions panel when openDirections is called
  useEffect(() => {
    if (openRequestId > prevOpenRequestId.current) {
      prevOpenRequestId.current = openRequestId
      // Set the flag so the activeTab focus effect will focus #directions-from-input.
      openFromNavRef.current = true
      openTab('directions')
      // If the panel is already open on 'directions', activeTab won't change so the
      // focus effect won't fire — schedule focus directly for that case.
      if (activeTabRef.current === 'directions') {
        requestAnimationFrame(() => {
          const fromField = panelRootRef.current?.querySelector<HTMLElement>('#directions-from-input')
          fromField?.focus()
        })
      }
    }
  }, [openRequestId])

  // Return to the appropriate panel when closeDirections is called
  useEffect(() => {
    if (closeRequestId > prevCloseRequestId.current) {
      prevCloseRequestId.current = closeRequestId
      const tab = getTabForFeatureType(params.type, params.activityId)
      if (tab) openTab(tab)
      else setActiveTab(null)
    }
  }, [closeRequestId, params.type, params.activityId])

  useImperativeHandle(ref, () => ({
    activateSearchTab: () => {
      openFromNavRef.current = true
      openTab('search')
    },
    closePanel: () => {
      handleClosePanel()
    },
    collapseSheet: () => {
      handleCollapseSheet()
    },
  }))

  // Clear feature-selection URL params so the URL-sync effect doesn't reopen a panel.
  // Preserves map position params (lat, lng, zoom, base) by only clearing these keys.
  const clearFeatureParams = () => {
    setParams(
      { type: null, gid: null, activityId: null, fromSearch: null },
      false,
      false
    )
  }

  const handleGoHome = () => {
    if (activeTab) lastActiveTab.current = activeTab
    setActiveTab(null)
    clearFeatureParams()
    if (mapInstance) {
      mapInstance.flyTo({
        center: mapConfig.startCenter,
        zoom: isMobile ? mapConfig.mobileStartZoom : mapConfig.startZoom,
        duration: 1000,
      })
    }
  }

  const handleClosePanel = () => {
    if (activeTab) lastActiveTab.current = activeTab
    setActiveTab(null)
    setSheetState('collapsed')
    setDragOffset(0)
    openFromNavRef.current = false
    clearFeatureParams()
    requestAnimationFrame(() => {
      lastFocusedNavTabRef.current?.focus()
    })
  }

  const handleCollapseSheet = () => {
    // If a feature is selected, go back to peeked rather than fully collapsed
    setSheetState(params.type && params.gid ? 'peeked' : 'collapsed')
    setDragOffset(0)
    // intentionally does NOT clear activeTab or URL params
  }

  const handleTabChange = (value: string | null) => {
    if (!value) return
    if (sheetState === 'collapsed' || sheetState === 'peeked') {
      // Sheet is collapsed or peeked — always expand fully to the tapped tab
      openFromNavRef.current = true
      setSheetState('expanded')
      setActiveTab(value)
      return
    }
    if (value === activeTab) {
      // Sheet is expanded and user taps the active tab — close fully
      handleClosePanel()
      return
    }
    openFromNavRef.current = true
    clearFeatureParams()
    setSheetState('expanded')
    setActiveTab(value)
  }

  useEffect(() => {
    if (panelRootRef.current) panelRootRef.current.scrollTop = 0
  }, [activeTab])

  useEffect(() => {
    if (!activeTab || !openFromNavRef.current) return
    openFromNavRef.current = false

    const root = panelRootRef.current
    if (!root) return

    const focusPrimary = (): boolean => {
      // 1. Tab-specific inputs (inside lazy panel — may not be in DOM yet on first open)
      const specificEl =
        activeTab === 'search'
          ? root.querySelector<HTMLElement>('#search-panel-input')
          : activeTab === 'directions'
            ? root.querySelector<HTMLElement>('#directions-from-input')
            : null
      if (specificEl) { specificEl.focus(); return true }

      // 2. Generic primary-focus marker (e.g. BackButton in detail views)
      const primaryEl = root.querySelector<HTMLElement>('[data-primary-focus="true"]')
      if (primaryEl) { primaryEl.focus(); return true }

      // 3. Panel close button — outside panelRootRef on desktop, so walk up to the
      //    tabpanel boundary and search from there. Handles listing panels that have
      //    no more specific primary target.
      const closeEl = root.closest('[role="tabpanel"]')?.querySelector<HTMLElement>('[data-panel-close-focus="true"]')
        ?? root.querySelector<HTMLElement>('[data-panel-close-focus="true"]')
      if (closeEl) { closeEl.focus(); return true }

      return false
    }

    // Element already in DOM (lazy chunk already cached from a prior open)
    if (focusPrimary()) return

    // Element not yet in DOM — lazy chunk is still loading. Wait for it.
    const observer = new MutationObserver(() => {
      if (focusPrimary()) {
        observer.disconnect()
        clearTimeout(timeout)
      }
    })
    observer.observe(root, { childList: true, subtree: true })

    // Safety net: if the primary target never appears, give up.
    const timeout = setTimeout(() => {
      observer.disconnect()
    }, 2000)

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [activeTab])

  // Tab item component for consistent rendering (desktop)
  const TabItem = ({
    value,
    icon,
    label,
    section = 'top'
  }: {
    value: string
    icon: React.ReactNode
    label: string
    section?: 'top' | 'bottom'
  }) => {
    const colors = section === 'top' ? SIDEBAR_COLORS.topSection : SIDEBAR_COLORS.bottomSection
    const isActive = activeTab === value
    const isTopSection = section === 'top'
    const tabId = `sidebar-tab-${value}`

    // Top section: rounded highlight, not full width, no left border
    // Bottom section: full width with left border
    if (isTopSection) {
      return (
        <UnstyledButton
          type="button"
          role="tab"
          tabIndex={0}
          id={tabId}
          aria-selected={isActive}
          onClick={(event) => {
            lastFocusedNavTabRef.current = event.currentTarget
            handleTabChange(value)
          }}
          onFocus={(event) => {
            lastFocusedNavTabRef.current = event.currentTarget
          }}
          title={isNavExpanded ? undefined : label}
          style={{
            padding: isNavExpanded ? '2px 8px' : '2px 6px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            borderRadius: '6px',
          }}
          sx={{
            '&:focus-visible': {
              outline: '2px solid #6AB03E',
              outlineOffset: '-2px',
            },
          }}
        >
          <Box
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: isNavExpanded ? 'flex-start' : 'center',
              gap: isNavExpanded ? '12px' : '0',
              padding: isNavExpanded ? '8px 12px' : '8px',
              minHeight: '36px',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
            }}
            sx={{
              backgroundColor: isActive ? '#222124' : 'transparent',
              '&:hover': {
                backgroundColor: isActive ? '#222124' : '#1a1a1a',
              },
            }}
          >
            {icon}
            {isNavExpanded && (
              <Text
                size="sm"
                weight={isActive ? 600 : 400}
                style={{ color: colors.text }}
              >
                {label}
              </Text>
            )}
          </Box>
        </UnstyledButton>
      )
    }

    // Bottom section: original styling
    return (
      <UnstyledButton
        type="button"
        role="tab"
        tabIndex={0}
        id={tabId}
        aria-selected={isActive}
        onClick={(event) => {
          lastFocusedNavTabRef.current = event.currentTarget
          handleTabChange(value)
        }}
        onFocus={(event) => {
          lastFocusedNavTabRef.current = event.currentTarget
        }}
        title={isNavExpanded ? undefined : label}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isNavExpanded ? 'flex-start' : 'center',
          gap: isNavExpanded ? '12px' : '0',
          padding: isNavExpanded ? '8px 16px' : '8px',
          minHeight: '36px',
          cursor: 'pointer',
          borderLeft: isActive ? `3px solid ${colors.icon}` : '3px solid transparent',
          transition: 'background-color 0.15s ease',
        }}
        sx={{
          backgroundColor: isActive ? colors.activeBackground : 'transparent',
          '&:hover': {
            backgroundColor: colors.activeBackground,
          },
          '&:focus-visible': {
            outline: '2px solid #6AB03E',
            outlineOffset: '-2px',
          },
        }}
      >
        {icon}
        {isNavExpanded && (
          <Text
            size="sm"
            weight={isActive ? 600 : 400}
            style={{ color: colors.text }}
          >
            {label}
          </Text>
        )}
      </UnstyledButton>
    )
  }

  // Mobile tab icon button component
  const MobileTabIcon = ({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) => {
    const isActive = activeTab === value
    const tabId = `sidebar-tab-${value}`
    return (
      <UnstyledButton
        type="button"
        role="tab"
        id={tabId}
        tabIndex={0}
        aria-selected={isActive}
        aria-label={label}
        onClick={(event) => {
          lastFocusedNavTabRef.current = event.currentTarget
          handleTabChange(value)
        }}
        onFocus={(event) => {
          lastFocusedNavTabRef.current = event.currentTarget
        }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? '#222124' : 'transparent',
          color: '#A6CE39',
          border: isActive ? '1.5px solid #A6CE39' : '1.5px solid rgba(255,255,255,0.25)',
          flexShrink: 0,
        }}
        sx={{
          '&:focus-visible': {
            outline: '2px solid #6AB03E',
          },
        }}
      >
        {icon}
      </UnstyledButton>
    )
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    const isExpanded = sheetState === 'expanded'
    const isPeeked = sheetState === 'peeked'
    const baseTranslate =
      sheetState === 'expanded' ? `${MOBILE_SHEET_EXPANDED_TOP}px` :
      sheetState === 'peeked'   ? `calc(100dvh - ${MOBILE_SHEET_PEEKED_HEIGHT}px)` :
                                  `calc(100dvh - ${MOBILE_BOTTOM_BAR_HEIGHT}px)`
    const sheetTransform = `translateY(calc(${baseTranslate} + ${dragOffset}px))`

    const handleSheetTouchStart = (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY
      isDragGesture.current = false
    }

    const handleSheetTouchMove = (e: React.TouchEvent) => {
      const dy = e.touches[0].clientY - startY.current
      if (Math.abs(dy) > 8) isDragGesture.current = true
      setIsDragging(true)
      if (isExpanded) {
        setDragOffset(Math.max(0, dy))
      } else if (isPeeked) {
        // Allow drag both up and down from peeked state
        setDragOffset(dy)
      } else {
        setDragOffset(Math.min(0, dy))
      }
    }

    const handleSheetTouchEnd = () => {
      setIsDragging(false)
      if (isDragGesture.current) {
        if (sheetState === 'collapsed' && dragOffset < -80) {
          setSheetState('expanded')
          setDragOffset(0)
        } else if (sheetState === 'peeked' && dragOffset < -80) {
          setSheetState('expanded')
          setDragOffset(0)
        } else if (sheetState === 'peeked' && dragOffset > 80) {
          setSheetState('collapsed')
          setDragOffset(0)
        } else if (sheetState === 'expanded' && dragOffset > 80) {
          handleCollapseSheet()
        } else {
          setDragOffset(0)
        }
      } else {
        const now = Date.now()
        if (now - lastTapTime.current < 300) {
          lastTapTime.current = 0
          handleSheetToggle()
        } else {
          lastTapTime.current = now
        }
        setDragOffset(0)
      }
    }

    const handleSheetToggle = () => {
      if (isExpanded) {
        handleCollapseSheet()
      } else if (isPeeked) {
        setSheetState('expanded')
      } else {
        setSheetState('expanded')
      }
    }

    return createPortal(
      <div
        role="dialog"
        aria-label="Sidebar"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.22)',
          transform: sheetTransform,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          zIndex: 199,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: MOBILE_SHEET_EXPANDED_TOP,
        }}
      >
        {/* Sheet header — always visible, black background */}
        <div
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onDoubleClick={handleSheetToggle}
          style={{
            backgroundColor: '#000',
            flexShrink: 0,
            borderRadius: '20px 20px 0 0',
            userSelect: 'none',
          }}
        >
          {/* Drag pill row */}
          <div
            style={{
              height: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#fff',
              }}
            />
          </div>

          {/* Nav row */}
          <div
            style={{
              height: 50,
              padding: '0 16px 12px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: logo */}
            <img
              src="/images/misc/your-time-your-place-398x127.png"
              alt="Your Time, Your Place"
              style={{ height: 36, width: 'auto' }}
            />

            {/* Right: tab buttons */}
            <div role="tablist" aria-label="Sidebar navigation" style={{ display: 'flex', gap: 8 }}>
              <MobileTabIcon value="parks" icon={<Tree size={20} />} label="Parks" />
              <MobileTabIcon value="activities" icon={<Flag3 size={20} />} label="Activities" />
              <MobileTabIcon value="trails" icon={<Walk size={20} />} label="Trails" />
            </div>
          </div>
        </div>

        {/* Peek strip — visible only when sheet is in peeked state */}
        {isPeeked && (
          <div
            style={{
              height: MOBILE_SHEET_PEEK_STRIP_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              backgroundColor: DARK_MODE_MOBILE ? '#111111' : '#fff',
              borderBottom: `1px solid ${DARK_MODE_MOBILE ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              flexShrink: 0,
            }}
          >
            {activeTab === 'directions' && (
              <Route size={18} color="#A6CE39" style={{ flexShrink: 0, marginRight: 8 }} />
            )}
            {activeTab !== 'directions' && params.type === 'park' && (
              <Tree size={18} color="#A6CE39" style={{ flexShrink: 0, marginRight: 8 }} />
            )}
            {activeTab !== 'directions' && params.type === 'trail' && (
              <Walk size={18} color="#A6CE39" style={{ flexShrink: 0, marginRight: 8 }} />
            )}
            {activeTab !== 'directions' && params.type === 'attraction' && (
              <Flag3 size={18} color="#A6CE39" style={{ flexShrink: 0, marginRight: 8 }} />
            )}
            <Text
              size="sm"
              weight={600}
              style={{
                color: DARK_MODE_MOBILE ? '#fff' : '#000',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: 12,
              }}
            >
              {activeTab === 'directions' ? (directionsTitle ?? '') : (selectedFeatureTitle ?? '')}
            </Text>
            {activeTab === 'directions' && isDirectionsLoading
              ? <Loader size="xs" color="#6AB03E" />
              : (
                <UnstyledButton
                  type="button"
                  aria-label="Expand details"
                  onClick={() => setSheetState('expanded')}
                  style={{ flexShrink: 0, padding: 8 }}
                  sx={{ '&:focus-visible': { outline: '2px solid #6AB03E', borderRadius: 4 } }}
                >
                  <ChevronDown size={20} color={DARK_MODE_MOBILE ? '#fff' : '#222124'} />
                </UnstyledButton>
              )
            }
          </div>
        )}

        {/* Panel content */}
        <div
          ref={(node) => { panelRootRef.current = node }}
          role={activeTab ? 'tabpanel' : undefined}
          id={activeTab ? `sidebar-panel-${activeTab}` : undefined}
          aria-labelledby={activeTab ? `sidebar-tab-${activeTab}` : undefined}
          className={DARK_MODE_MOBILE ? 'dark-panel-content' : undefined}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'none', backgroundColor: DARK_MODE_MOBILE ? '#111111' : '#fff', paddingBottom: 20 }}
        >
          {activeTab === null && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                { value: 'parks', icon: <Tree size={24} color="#A6CE39" />, label: 'Parks' },
                { value: 'activities', icon: <Flag3 size={24} color="#A6CE39" />, label: 'Activities' },
                { value: 'trails', icon: <Walk size={24} color="#A6CE39" />, label: 'Trails' },
              ] as const).map(({ value, icon, label }) => (
                <UnstyledButton
                  key={value}
                  type="button"
                  onClick={() => handleTabChange(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    backgroundColor: '#222124',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                  }}
                  sx={{
                    '&:hover': { backgroundColor: '#2d2b30', borderColor: 'rgba(166,206,57,0.4)' },
                    '&:focus-visible': { outline: '2px solid #6AB03E' },
                  }}
                >
                  {icon}
                  <Text size="md" weight={600} style={{ color: '#fff' }}>{label}</Text>
                </UnstyledButton>
              ))}
            </div>
          )}
          {activeTab !== null && (
            <Suspense fallback={<PanelLoader />}>
              {activeTab === 'search' && <SearchPanel onClose={handleClosePanel} />}
              {activeTab === 'parks' && <ParksPanel onClose={handleClosePanel} onGoHome={handleGoHome} />}
              {activeTab === 'activities' && <ActivitiesPanel onClose={handleClosePanel} onGoHome={handleGoHome} />}
              {activeTab === 'trails' && <TrailsPanel onClose={handleClosePanel} onGoHome={handleGoHome} />}
              {activeTab === 'share' && <SharePanel onClose={handleClosePanel} />}
              {activeTab === 'directions' && <DirectionsPanel onClose={handleClosePanel} onPeekWithTitle={(title) => { setDirectionsTitle(title); setSheetState('peeked') }} onExpandSheet={() => setSheetState('expanded')} />}
              {activeTab === 'info' && <CreditsPanel onClose={handleClosePanel} />}
              {showDebugTab && activeTab === 'debug' && <DebugPanel onClose={handleClosePanel} />}
            </Suspense>
          )}
        </div>
      </div>,
      document.body
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <Tabs
      value={activeTab}
      onTabChange={handleTabChange}
      orientation="vertical"
      style={{ height: '100%', width: '100%' }}
      styles={() => ({
        root: {
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          overflow: 'visible',
        },
        tabsList: {
          width: `${navWidth}px`,
          flexShrink: 0,
          backgroundColor: SIDEBAR_COLORS.topSection.background,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          borderRight: 'none',
        },
        tab: {
          display: 'none', // Hide default tabs, we're using custom TabItem
        },
        tabLabel: {
          fontSize: '12px',
          lineHeight: 1.2,
        },
        tabIcon: {
          marginRight: '0 !important',
        },
        panel: {
          display: activeTab ? 'flex' : 'none',
          flexDirection: 'column',
          backgroundColor: SIDEBAR_COLORS.panel.background,
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)',
        },
      })}
    >
      <Tabs.List aria-label="Sidebar navigation">
        {/* Header - Image when expanded, hamburger when collapsed */}
        <Box
          style={{
            backgroundColor: SIDEBAR_COLORS.topSection.background,
            position: 'relative',
            padding: isNavExpanded ? '16px' : '12px 8px',
            minHeight: '77px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isNavExpanded ? 'flex-start' : 'center',
            justifyContent: isNavExpanded ? 'flex-start' : 'center',
          }}
        >
          {isNavExpanded ? (
            <>
              <img
                src="/images/misc/your-time-your-place-398x127.png"
                alt="Your Time, Your Place"
                style={{
                  height: '45px',
                  width: 'auto',
                }}
              />
              {/* Collapse button */}
              <ActionIcon
                onClick={toggleNavExpanded}
                aria-label="Collapse navigation"
                aria-expanded={isNavExpanded}
                size="sm"
                variant="transparent"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  color: SIDEBAR_COLORS.topSection.text,
                }}
                title="Collapse navigation"
              >
                <ChevronLeft size={20} />
              </ActionIcon>
            </>
          ) : (
            <ActionIcon
              onClick={toggleNavExpanded}
              aria-label="Expand navigation"
              aria-expanded={isNavExpanded}
              size="lg"
              variant="transparent"
              style={{
                color: SIDEBAR_COLORS.topSection.text,
              }}
              title="Expand navigation"
            >
              <Menu2 size={24} />
            </ActionIcon>
          )}
        </Box>

        {/* Top Section - Main navigation (black background) */}
        <Box style={{
          backgroundColor: SIDEBAR_COLORS.topSection.background,
          paddingBottom: '16px'
          }}>
          <Box style={{ height: '26px', display: 'flex', alignItems: 'flex-end' }}>
            {isNavExpanded && (
              <Text
                size="xs"
                weight={600}
                style={{
                  color: '#888888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  paddingLeft: '20px',
                  paddingBottom: '4px',
                }}
              >
                Explore
              </Text>
            )}
          </Box>
          <TabItem
            value="parks"
            icon={<Tree size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Parks"
          />
          <TabItem
            value="activities"
            icon={<Flag3 size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Activities"
          />
          <TabItem
            value="trails"
            icon={<Walk size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Trails"
          />

          {/* Divider */}
          <Box px={isNavExpanded ? 'md' : 'xs'} py="sm">
            <Divider color="rgba(255, 255, 255, 0.4)" />
          </Box>

          <TabItem
            value="directions"
            icon={<Route size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Directions"
          />
          <TabItem
            value="search"
            icon={<Search size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Search"
          />

          {/* Divider */}
          <Box px={isNavExpanded ? 'md' : 'xs'} py="sm">
            <Divider color="rgba(255, 255, 255, 0.4)" />
          </Box>

          <TabItem
            value="share"
            icon={<Share size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Share"
          />
        </Box>

        {/* Bottom Section - fills remaining space with gray background */}
        <Box
          style={{
            backgroundColor: SIDEBAR_COLORS.bottomSection.background,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Push menu items to bottom */}
          <Box style={{ marginTop: 'auto', paddingBottom: '12px' }}>
            <TabItem
              value="info"
              icon={<InfoCircle size={24} color={SIDEBAR_COLORS.bottomSection.icon} />}
              label="Credits"
              section="bottom"
            />
            {showDebugTab && (
              <TabItem
                value="debug"
                icon={<Bug size={24} color={SIDEBAR_COLORS.bottomSection.icon} />}
                label="Debug"
                section="bottom"
              />
            )}
          </Box>
        </Box>
      </Tabs.List>

      {activeTab && (
        <>
          <Tabs.Panel value="search" id="sidebar-panel-search" aria-labelledby="sidebar-tab-search" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'search') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <SearchPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="parks" id="sidebar-panel-parks" aria-labelledby="sidebar-tab-parks" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'parks') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <ParksPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="activities" id="sidebar-panel-activities" aria-labelledby="sidebar-tab-activities" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'activities') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <ActivitiesPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="trails" id="sidebar-panel-trails" aria-labelledby="sidebar-tab-trails" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'trails') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <TrailsPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="share" id="sidebar-panel-share" aria-labelledby="sidebar-tab-share" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'share') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <SharePanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="directions" id="sidebar-panel-directions" aria-labelledby="sidebar-tab-directions" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'directions') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <DirectionsPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="info" id="sidebar-panel-info" aria-labelledby="sidebar-tab-info" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box
              ref={(node) => {
                if (activeTab === 'info') panelRootRef.current = node
              }}
              style={{ position: 'relative', height: '100%', overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                <CreditsPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          {showDebugTab && (
            <Tabs.Panel value="debug" id="sidebar-panel-debug" aria-labelledby="sidebar-tab-debug" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
              <PanelCloseButton onClick={handleClosePanel} variant="dark" />
              <Box
                ref={(node) => {
                  if (activeTab === 'debug') panelRootRef.current = node
                }}
                style={{ position: 'relative', height: '100%', overflow: 'auto' }}
              >
                <Suspense fallback={<PanelLoader />}>
                  <DebugPanel onClose={handleClosePanel} />
                </Suspense>
              </Box>
            </Tabs.Panel>
          )}
        </>
      )}
    </Tabs>
  )
})

Sidebar.displayName = 'Sidebar'
