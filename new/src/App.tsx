import { Routes, Route } from 'react-router-dom'
import { MapView } from './components/MapView'
import { Layout } from './components/Layout'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MapView />} />
        {/* Add more routes as needed */}
      </Routes>
    </Layout>
  )
}

export default App
