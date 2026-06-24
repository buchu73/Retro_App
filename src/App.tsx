import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import CreateRetro from './pages/CreateRetro'
import RetroBoard from './pages/RetroBoard'
import JoinRetro from './pages/JoinRetro'
import { RetroProvider } from './context/RetroContext'

const App: React.FC = () => {
  return (
    <RetroProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateRetro />} />
        <Route path="/j/:retroId" element={<JoinRetro />} />
        <Route path="/r/:retroId" element={<RetroBoard />} />
        <Route path="*" element={<div className='p-4'>Page non trouvée</div>} />
      </Routes>
    </RetroProvider>
  )
}

export default App
