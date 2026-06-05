import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_ADMIN = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/alumnos', label: 'Alumnos', icon: '👥' },
  { to: '/cuotas', label: 'Cuotas', icon: '💰' },
  { to: '/gastos', label: 'Gastos', icon: '📋' },
]

const NAV_PROFE = [
  { to: '/alumnos', label: 'Alumnos', icon: '👥' },
]

export default function Layout() {
  const { rol, logout } = useAuth()
  const [gymName, setGymName] = useState('')

  useEffect(() => {
    window.api.getConfig().then(cfg => {
      const nombre = cfg.nombre_gimnasio || 'Gimnasio'
      setGymName(nombre)
      window.api.setWindowTitle(`${nombre} Admin`)
    })
  }, [])

  const nav = rol === 'admin' ? NAV_ADMIN : NAV_PROFE

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <aside className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">{gymName}</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">Administración</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <span className="text-slate-600 text-xs">{rol === 'admin' ? '👤 Admin' : '👤 Profe'}</span>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-slate-500 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
