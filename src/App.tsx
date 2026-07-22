import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { AgentPage } from './pages/AgentPage'
import { CreatePage } from './pages/CreatePage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { StudioPage } from './pages/StudioPage'
import { TasksPage } from './pages/TasksPage'
import { useAuth } from './context/AuthContext'
import { PlaybackProvider } from './context/PlaybackContext'

function ProtectedApp() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <div className="app-loading"><span /><strong>正在连接音频资产服务</strong></div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <PlaybackProvider><AppShell /></PlaybackProvider>
}
import './App.css'

function useTimeTheme() {
  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours()
      const theme = hour >= 7 && hour < 19 ? 'light' : 'dark'
      document.documentElement.dataset.theme = theme
    }

    applyTheme()
    const timer = window.setInterval(applyTheme, 60_000)
    return () => window.clearInterval(timer)
  }, [])
}

function App() {
  useTimeTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedApp />}>
          <Route index element={<HomePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="assistant" element={<AgentPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
