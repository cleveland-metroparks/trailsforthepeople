import { Tabs, Loader, Center, ActionIcon, Box, Text, Divider } from '@mantine/core'
import { Search, Share, InfoCircle, Trees, Walk, Flag3, Bug, ChevronLeft, Menu2 } from 'tabler-icons-react'
import { PanelCloseButton } from './PanelCloseButton'
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, Suspense, lazy } from 'react'
import { useURLState } from '../hooks/useURLState'
import { useMapSelection } from '../contexts/MapSelectionContext'

// Lazy load all panels
const SearchPanel = lazy(() => import('./panels/SearchPanel').then(m => ({ default: m.SearchPanel })))
const SharePanel = lazy(() => import('./panels/SharePanel').then(m => ({ default: m.SharePanel })))
const CreditsPanel = lazy(() => import('./panels/CreditsPanel').then(m => ({ default: m.CreditsPanel })))
const ParksPanel = lazy(() => import('./panels/ParksPanel').then(m => ({ default: m.ParksPanel })))
const ActivitiesPanel = lazy(() => import('./panels/ActivitiesPanel').then(m => ({ default: m.ActivitiesPanel })))
const TrailsPanel = lazy(() => import('./panels/TrailsPanel').then(m => ({ default: m.TrailsPanel })))
const DebugPanel = lazy(() => import('./panels/DebugPanel').then(m => ({ default: m.DebugPanel })))

// Nav widths
const NAV_WIDTH_EXPANDED = 200
const NAV_WIDTH_COLLAPSED = 76

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

export { NAV_WIDTH_EXPANDED, NAV_WIDTH_COLLAPSED }

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
  const { params, setParams } = useURLState()
  const { selectionTick } = useMapSelection()

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
    (window as any).showDebugPanel = () => {
      setShowDebugTab(true)
      setActiveTab('debug')
    }
    return () => {
      delete (window as any).showDebugPanel
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

  useImperativeHandle(ref, () => ({
    activateSearchTab: () => {
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
    clearFeatureParams()
  }

  const handleTabChange = (value: string | null) => {
    if (value === activeTab) {
      handleClosePanel()
      return
    }
    if (value) {
      clearFeatureParams()
      setActiveTab(value)
    }
  }

  // Tab item component for consistent rendering
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

    // Top section: rounded highlight, not full width, no left border
    // Bottom section: full width with left border
    if (isTopSection) {
      return (
        <Box
          onClick={() => handleTabChange(value)}
          title={isNavExpanded ? undefined : label}
          style={{
            padding: isNavExpanded ? '2px 8px' : '2px 6px',
            cursor: 'pointer',
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
              backgroundColor: isActive ? '#222124' : 'transparent',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
            }}
            sx={{
              '&:hover': {
                backgroundColor: isActive ? '#222124' : 'rgba(255, 255, 255, 0.1)',
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
        </Box>
      )
    }

    // Bottom section: original styling
    return (
      <Box
        onClick={() => handleTabChange(value)}
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
          backgroundColor: isActive ? colors.activeBackground : 'transparent',
          borderLeft: isActive ? `3px solid ${colors.icon}` : '3px solid transparent',
          transition: 'background-color 0.15s ease',
        }}
        sx={{
          '&:hover': {
            backgroundColor: isActive ? colors.activeBackground : 'rgba(255, 255, 255, 0.1)',
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
    )
  }

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
        },
      })}
    >
      <Tabs.List>
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
            icon={<Trees size={24} color={SIDEBAR_COLORS.topSection.icon} />}
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
            value="search"
            icon={<Search size={24} color={SIDEBAR_COLORS.topSection.icon} />}
            label="Search"
          />
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
          <Tabs.Panel value="search" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <SearchPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="parks" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <ParksPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="activities" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <ActivitiesPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="trails" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <TrailsPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="share" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <SharePanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="info" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
            <PanelCloseButton onClick={handleClosePanel} />
            <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
              <Suspense fallback={<PanelLoader />}>
                <CreditsPanel onClose={handleClosePanel} />
              </Suspense>
            </Box>
          </Tabs.Panel>

          {showDebugTab && (
            <Tabs.Panel value="debug" style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
              <PanelCloseButton onClick={handleClosePanel} variant="dark" />
              <Box style={{ position: 'relative', height: '100%', overflow: 'auto' }}>
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
