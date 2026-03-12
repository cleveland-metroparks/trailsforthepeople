import { Tabs, Loader, Center, ActionIcon, Box, Text, Divider, UnstyledButton } from '@mantine/core'
import { Search, Share, InfoCircle, Tree, Walk, Flag3, Bug, ChevronLeft, Menu2, Route, X } from 'tabler-icons-react'
import { PanelCloseButton } from './PanelCloseButton'
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, Suspense, lazy } from 'react'
import { useURLState } from '../hooks/useURLState'
import { useMapSelection } from '../contexts/MapSelectionContext'
import { useDirections } from '../contexts/DirectionsContext'
import { useSidebar } from '../contexts/SidebarContext'
import { NAV_WIDTH_EXPANDED, NAV_WIDTH_COLLAPSED, MOBILE_BOTTOM_BAR_HEIGHT } from './sidebarConstants'

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
    background: '#FFFFFF',
    heading: '#000000',
    text: '#000000',
    button: '#6AB03E',
    icon: '#6AB03E',
  },
}

interface SidebarProps {
  onPanelStateChange?: (hasActivePanel: boolean) => void
  onNavExpandedChange?: (isExpanded: boolean) => void
}

export interface SidebarRef {
  activateSearchTab: () => void
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

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onPanelStateChange, onNavExpandedChange }, ref) => {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showDebugTab, setShowDebugTab] = useState(false)
  const [isNavExpanded, setIsNavExpanded] = useState(true)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const { params, setParams } = useURLState()
  const { selectionTick } = useMapSelection()
  const { openRequestId, closeRequestId } = useDirections()
  const { isMobile } = useSidebar()
  const prevOpenRequestId = useRef(0)
  const prevCloseRequestId = useRef(0)
  const lastFocusedNavTabRef = useRef<HTMLButtonElement | null>(null)
  const panelRootRef = useRef<HTMLDivElement | null>(null)
  const openFromNavRef = useRef(false)
  const startY = useRef(0)

  // Track activeTab in a ref so the URL-sync effect can read it without depending on it.
  // This breaks the feedback loop: user tab changes don't re-trigger the URL-sync effect.
  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    onPanelStateChange?.(activeTab !== null)
  }, [activeTab, onPanelStateChange])

  useEffect(() => {
    onNavExpandedChange?.(isNavExpanded)
  }, [isNavExpanded, onNavExpandedChange])

  // Expose showDebugPanel to the console for developers
  useEffect(() => {
    (window as Window & { showDebugPanel?: () => void }).showDebugPanel = () => {
      setShowDebugTab(true)
      setActiveTab('debug')
    }
    return () => {
      delete (window as Window & { showDebugPanel?: () => void }).showDebugPanel
    }
  }, [])

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
      return
    }

    const tabForFeature = getTabForFeatureType(params.type, params.activityId)
    if (tabForFeature) {
      setActiveTab(tabForFeature)
    }
  }, [params.type, params.activityId, params.fromSearch, selectionTick])

  // Switch to directions panel when openDirections is called
  useEffect(() => {
    if (openRequestId > prevOpenRequestId.current) {
      prevOpenRequestId.current = openRequestId
      setActiveTab('directions')
    }
  }, [openRequestId])

  // Return to the appropriate panel when closeDirections is called
  useEffect(() => {
    if (closeRequestId > prevCloseRequestId.current) {
      prevCloseRequestId.current = closeRequestId
      const tab = getTabForFeatureType(params.type, params.activityId)
      setActiveTab(tab)
    }
  }, [closeRequestId, params.type, params.activityId])

  useImperativeHandle(ref, () => ({
    activateSearchTab: () => {
      openFromNavRef.current = true
      setActiveTab('search')
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

  const handleClosePanel = () => {
    setActiveTab(null)
    setDragOffset(0)
    openFromNavRef.current = false
    clearFeatureParams()
    requestAnimationFrame(() => {
      lastFocusedNavTabRef.current?.focus()
    })
  }

  const handleTabChange = (value: string | null) => {
    if (value === activeTab) {
      handleClosePanel()
      return
    }
    if (value) {
      openFromNavRef.current = true
      clearFeatureParams()
      setActiveTab(value)
    }
  }

  useEffect(() => {
    if (!activeTab || !openFromNavRef.current) return
    openFromNavRef.current = false

    requestAnimationFrame(() => {
      const root = panelRootRef.current
      if (!root) return

      const primaryByTab =
        activeTab === 'search'
          ? '#search-panel-input'
          : activeTab === 'directions'
            ? '#directions-from-input'
            : '[data-primary-focus="true"]'

      const primaryTarget = root.querySelector<HTMLElement>(primaryByTab)
      if (primaryTarget) {
        primaryTarget.focus()
        return
      }

      const fallbackTarget = root.querySelector<HTMLElement>(
        'input, button:not([data-skip-auto-focus="true"]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      fallbackTarget?.focus()
    })
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
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? '#222124' : 'transparent',
          color: isActive ? '#A6CE39' : '#9E9E9E',
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
    return (
      <>
        {/* Bottom sheet — rendered above the bottom bar when a tab is open */}
        {activeTab !== null && (
          <div
            role="tabpanel"
            id={`sidebar-panel-${activeTab}`}
            aria-labelledby={`sidebar-tab-${activeTab}`}
            style={{
              position: 'fixed',
              top: 72,
              bottom: MOBILE_BOTTOM_BAR_HEIGHT,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.22)',
              transform: `translateY(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease',
              zIndex: 199,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle row */}
            <div
              role="button"
              aria-label="Drag to collapse panel"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClosePanel()
              }}
              onTouchStart={(e) => {
                startY.current = e.touches[0].clientY
              }}
              onTouchMove={(e) => {
                const dy = e.touches[0].clientY - startY.current
                if (dy > 0) {
                  setIsDragging(true)
                  setDragOffset(dy)
                }
              }}
              onTouchEnd={() => {
                setIsDragging(false)
                if (dragOffset > 80) {
                  handleClosePanel()
                } else {
                  setDragOffset(0)
                }
              }}
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {/* Pill */}
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#ccc',
                }}
              />
              {/* X close button */}
              <ActionIcon
                onClick={handleClosePanel}
                aria-label="Close panel"
                style={{ position: 'absolute', top: 8, right: 12 }}
              >
                <X size={16} />
              </ActionIcon>
            </div>

            {/* Scrollable panel content */}
            <div
              ref={(node) => {
                panelRootRef.current = node
              }}
              style={{ flex: 1, overflow: 'auto' }}
            >
              <Suspense fallback={<PanelLoader />}>
                {activeTab === 'search' && <SearchPanel onClose={handleClosePanel} />}
                {activeTab === 'parks' && <ParksPanel onClose={handleClosePanel} />}
                {activeTab === 'activities' && <ActivitiesPanel onClose={handleClosePanel} />}
                {activeTab === 'trails' && <TrailsPanel onClose={handleClosePanel} />}
                {activeTab === 'share' && <SharePanel onClose={handleClosePanel} />}
                {activeTab === 'directions' && <DirectionsPanel onClose={handleClosePanel} />}
                {activeTab === 'info' && <CreditsPanel onClose={handleClosePanel} />}
                {showDebugTab && activeTab === 'debug' && <DebugPanel onClose={handleClosePanel} />}
              </Suspense>
            </div>
          </div>
        )}

        {/* Mobile bottom bar — always visible */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: '#000',
            padding: '12px 16px',
            height: MOBILE_BOTTOM_BAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <img
            src="/images/misc/your-time-your-place-398x127.png"
            alt="Your Time, Your Place"
            style={{ height: 40, width: 'auto' }}
          />
          <div role="tablist" aria-label="Sidebar navigation" style={{ display: 'flex', gap: 8 }}>
            <MobileTabIcon value="parks" icon={<Tree size={20} />} label="Parks" />
            <MobileTabIcon value="activities" icon={<Flag3 size={20} />} label="Activities" />
            <MobileTabIcon value="trails" icon={<Walk size={20} />} label="Trails" />
          </div>
        </div>
      </>
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
