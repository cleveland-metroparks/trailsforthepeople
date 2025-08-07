import { Tabs } from '@mantine/core'
import { Search, MapPin, Route, Share, InfoCircle } from 'tabler-icons-react'
import { SearchPanel } from './panels/SearchPanel'
import { NearbyPanel } from './panels/NearbyPanel'
import { DirectionsPanel } from './panels/DirectionsPanel'
import { SharePanel } from './panels/SharePanel'
import { InfoPanel } from './panels/InfoPanel'

export function Sidebar() {
  return (
    <Tabs defaultValue="search" orientation="vertical" style={{ height: '100%' }}>
      <Tabs.List>
        <Tabs.Tab value="search" icon={<Search size={16} />}>
          Find
        </Tabs.Tab>
        <Tabs.Tab value="nearby" icon={<MapPin size={16} />}>
          Nearby
        </Tabs.Tab>
        <Tabs.Tab value="directions" icon={<Route size={16} />}>
          Directions
        </Tabs.Tab>
        <Tabs.Tab value="share" icon={<Share size={16} />}>
          Share
        </Tabs.Tab>
        <Tabs.Tab value="info" icon={<InfoCircle size={16} />}>
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
