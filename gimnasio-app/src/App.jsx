import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Alumnos from './pages/Alumnos'
import AlumnoDetalle from './pages/AlumnoDetalle'
import Cuotas from './pages/Cuotas'
import Gastos from './pages/Gastos'
import Setup from './pages/Setup'
import Login from './pages/Login'

function Spinner() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes({ rol, setRol }) {
  const [setupDone, setSetupDone] = useState(null)

  useEffect(() => {
    if (rol) {
      window.api.getConfig().then(cfg => setSetupDone(cfg.setup_done === '1'))
    }
  }, [rol])

  if (!rol) return <Login onLogin={setRol} />
  if (setupDone === null) return <Spinner />
  if (!setupDone) return <Setup onDone={() => setSetupDone(true)} />

  const logout = () => setRol(null)

  return (
    <AuthContext.Provider value={{ rol, logout }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={rol === 'admin' ? '/dashboard' : '/alumnos'} replace />} />
          {rol === 'admin' && <Route path="dashboard" element={<Dashboard />} />}
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="alumnos/:id" element={<AlumnoDetalle />} />
          {rol === 'admin' && <Route path="cuotas" element={<Cuotas />} />}
          {rol === 'admin' && <Route path="gastos" element={<Gastos />} />}
          <Route path="*" element={<Navigate to={rol === 'admin' ? '/dashboard' : '/alumnos'} replace />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  )
}

export default function App() {
  const [rol, setRol] = useState(null)

  return (
    <HashRouter>
      <AppRoutes rol={rol} setRol={setRol} />
    </HashRouter>
  )
}
