import { Tabs, Divider, Loader, Center } from '@mantine/core'
import { Search, MapPin, Route, Share, InfoCircle, Trees, Walk, Golf } from 'tabler-icons-react'
import { useState, useEffect, useImperativeHandle, forwardRef, useRef, Suspense, lazy } from 'react'
import { useURLState } from '../hooks/useURLState'

// Lazy load all panels
const SearchPanel = lazy(() => import('./panels/SearchPanel').then(m => ({ default: m.SearchPanel })))
const NearbyPanel = lazy(() => import('./panels/NearbyPanel').then(m => ({ default: m.NearbyPanel })))
const DirectionsPanel = lazy(() => import('./panels/DirectionsPanel').then(m => ({ default: m.DirectionsPanel })))
const SharePanel = lazy(() => import('./panels/SharePanel').then(m => ({ default: m.SharePanel })))
const InfoPanel = lazy(() => import('./panels/InfoPanel').then(m => ({ default: m.InfoPanel })))
const ParksPanel = lazy(() => import('./panels/ParksPanel').then(m => ({ default: m.ParksPanel })))
const ActivitiesPanel = lazy(() => import('./panels/ActivitiesPanel').then(m => ({ default: m.ActivitiesPanel })))
const TrailsPanel = lazy(() => import('./panels/TrailsPanel').then(m => ({ default: m.TrailsPanel })))

interface SidebarProps {
  onPanelStateChange?: (hasActivePanel: boolean) => void
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

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onPanelStateChange }, ref) => {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const { params } = useURLState()
  const initializedRef = useRef(false)

  useEffect(() => {
    onPanelStateChange?.(activeTab !== null)
  }, [activeTab, onPanelStateChange])

  // Open the appropriate panel when loading a feature via URL (on initial load only)
  useEffect(() => {
    if (initializedRef.current) return
    
    const tabForFeature = getTabForFeatureType(params.type, params.activityId)
    if (tabForFeature) {
      setActiveTab(tabForFeature)
      initializedRef.current = true
    }
  }, [params.type, params.activityId])

  useImperativeHandle(ref, () => ({
    activateSearchTab: () => {
      setActiveTab('search')
    },
  }))

  const handleClosePanel = () => {
    setActiveTab(null)
  }

  const handleTabChange = (value: string | null) => {
    setActiveTab(value === activeTab ? null : value)
  }

  return (
    <Tabs
      value={activeTab}
      onTabChange={handleTabChange}
      orientation="vertical"
      style={{ height: '100%', width: '100%' }}
      styles={(theme) => ({
        root: {
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
        },
        tabsList: {
          width: '80px',
          flexShrink: 0,
        },
        tab: {
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '12px 8px',
          minHeight: '70px',
          '&[data-active]': {
            backgroundColor: theme.colorScheme === 'dark' 
              ? theme.colors.dark[6] 
              : theme.colors.gray[1],
            borderLeft: `3px solid ${theme.colors.green[6]}`,
            fontWeight: 600,
          },
          '&[data-active="true"]': {
            backgroundColor: theme.colorScheme === 'dark' 
              ? theme.colors.dark[6] 
              : theme.colors.gray[1],
            borderLeft: `3px solid ${theme.colors.green[6]}`,
            fontWeight: 600,
          },
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
        },
      })}
    >
      <Tabs.List>
        <Tabs.Tab value="search" icon={<Search size={24} />}>
          Search
        </Tabs.Tab>

        <Divider orientation="horizontal" my="sm" />

        <Tabs.Tab value="parks" icon={<Trees size={24} color="#1d5c1e" />}>
          Parks
        </Tabs.Tab>
        <Tabs.Tab value="activities" icon={<Golf size={24} color="#1d5c1e" />}>
          Activities
        </Tabs.Tab>
        <Tabs.Tab value="trails" icon={<Walk size={24} color="#1d5c1e" />}>
          Trails
        </Tabs.Tab>

        <Divider orientation="horizontal" my="sm" />

        <Tabs.Tab value="directions" icon={<Route size={24} />}>
          Directions
        </Tabs.Tab>
        <Tabs.Tab value="nearby" icon={<MapPin size={24} />}>
          Nearby
        </Tabs.Tab>

        <Divider orientation="horizontal" my="sm" />

        <Tabs.Tab value="share" icon={<Share size={24} />}>
          Share
        </Tabs.Tab>
        <Tabs.Tab value="info" icon={<InfoCircle size={24} />}>
          Info
        </Tabs.Tab>
      </Tabs.List>

      {activeTab && (
        <>
          <Tabs.Panel value="search" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <SearchPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="parks" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <ParksPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="activities" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <ActivitiesPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="trails" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <TrailsPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="nearby" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <NearbyPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="directions" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <DirectionsPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="share" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <SharePanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="info" style={{ flex: 1, overflow: 'auto' }}>
            <Suspense fallback={<PanelLoader />}>
              <InfoPanel onClose={handleClosePanel} />
            </Suspense>
          </Tabs.Panel>
        </>
      )}
    </Tabs>
  )
})

Sidebar.displayName = 'Sidebar'
