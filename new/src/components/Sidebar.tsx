import { Tabs } from '@mantine/core'
import { Search, MapPin, Route, Share, InfoCircle } from 'tabler-icons-react'
import { SearchPanel } from './panels/SearchPanel'
import { NearbyPanel } from './panels/NearbyPanel'
import { DirectionsPanel } from './panels/DirectionsPanel'
import { SharePanel } from './panels/SharePanel'
import { InfoPanel } from './panels/InfoPanel'

export function Sidebar() {
  return (
    <Tabs
      defaultValue="search"
      orientation="vertical"
      style={{ height: '100%' }}
      styles={{
        tabsList: {
          width: '80px',
        },
        tab: {
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '12px 8px',
          minHeight: '70px',
        },
        tabLabel: {
          fontSize: '12px',
          lineHeight: 1.2,
        },
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="search" icon={<Search size={24} />}>
          Find
        </Tabs.Tab>
        <Tabs.Tab value="nearby" icon={<MapPin size={24} />}>
          Nearby
        </Tabs.Tab>
        <Tabs.Tab value="directions" icon={<Route size={24} />}>
          Directions
        </Tabs.Tab>
        <Tabs.Tab value="share" icon={<Share size={24} />}>
          Share
        </Tabs.Tab>
        <Tabs.Tab value="info" icon={<InfoCircle size={24} />}>
          Info
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="search" style={{ flex: 1, overflow: 'auto' }}>
        <SearchPanel />
      </Tabs.Panel>

      <Tabs.Panel value="nearby" style={{ flex: 1, overflow: 'auto' }}>
        <NearbyPanel />
      </Tabs.Panel>

      <Tabs.Panel value="directions" style={{ flex: 1, overflow: 'auto' }}>
        <DirectionsPanel />
      </Tabs.Panel>

      <Tabs.Panel value="share" style={{ flex: 1, overflow: 'auto' }}>
        <SharePanel />
      </Tabs.Panel>

      <Tabs.Panel value="info" style={{ flex: 1, overflow: 'auto' }}>
        <InfoPanel />
      </Tabs.Panel>
    </Tabs>
  )
}
