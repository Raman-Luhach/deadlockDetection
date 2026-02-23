import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import RagPage from './pages/RagPage'
import StepPage from './pages/StepPage'
import SimulatePage from './pages/SimulatePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="config" element={<HomePage />} />
            <Route path="rag" element={<RagPage />} />
            <Route path="step" element={<StepPage />} />
            <Route path="simulate" element={<SimulatePage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
