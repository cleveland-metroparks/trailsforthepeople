import { Tabs, Divider } from '@mantine/core'
import { Search, MapPin, Route, Share, InfoCircle, Trees, Walk, Golf } from 'tabler-icons-react'
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { SearchPanel } from './panels/SearchPanel'
import { NearbyPanel } from './panels/NearbyPanel'
import { DirectionsPanel } from './panels/DirectionsPanel'
import { SharePanel } from './panels/SharePanel'
import { InfoPanel } from './panels/InfoPanel'
import { ParksPanel } from './panels/ParksPanel'
import { ActivitiesPanel } from './panels/ActivitiesPanel'
import { TrailsPanel } from './panels/TrailsPanel'

interface SidebarProps {
  onPanelStateChange?: (hasActivePanel: boolean) => void
}

export interface SidebarRef {
  activateSearchTab: () => void
}

export const Sidebar = forwardRef<SidebarRef, SidebarProps>(({ onPanelStateChange }, ref) => {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    onPanelStateChange?.(activeTab !== null)
  }, [activeTab, onPanelStateChange])

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
            <SearchPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="parks" style={{ flex: 1, overflow: 'auto' }}>
            <ParksPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="activities" style={{ flex: 1, overflow: 'auto' }}>
            <ActivitiesPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="trails" style={{ flex: 1, overflow: 'auto' }}>
            <TrailsPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="nearby" style={{ flex: 1, overflow: 'auto' }}>
            <NearbyPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="directions" style={{ flex: 1, overflow: 'auto' }}>
            <DirectionsPanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="share" style={{ flex: 1, overflow: 'auto' }}>
            <SharePanel onClose={handleClosePanel} />
          </Tabs.Panel>

          <Tabs.Panel value="info" style={{ flex: 1, overflow: 'auto' }}>
            <InfoPanel onClose={handleClosePanel} />
          </Tabs.Panel>
        </>
      )}
    </Tabs>
  )
})

Sidebar.displayName = 'Sidebar'
