import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Layout } from './components/Layout'
import './App.css'

// Lazy load MapView to defer mapbox-gl loading until needed
const MapView = lazy(() => import('./components/MapView').then(m => ({ default: m.MapView })))

function App() {
  return (
    <Layout>
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading map...
        </div>
      }>
        <Routes>
          <Route path="/" element={<MapView />} />
          {/* Add more routes as needed */}
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
