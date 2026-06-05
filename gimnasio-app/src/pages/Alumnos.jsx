import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'

const FILTROS = ['Todos', 'Pendiente', 'Vencido', 'Pagado']

function SidePanel({ open, onClose, planes, onSave, alumno }) {
  const hoy = new Date().toISOString().split('T')[0]
  const empty = { nombre: '', apellido: '', telefono: '', email: '', plan: planes[0]?.nombre || 'Mensual', fecha_inicio: hoy, notas: '' }
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setForm(alumno
      ? { nombre: alumno.nombre, apellido: alumno.apellido, telefono: alumno.telefono || '', email: alumno.email || '', plan: alumno.plan, fecha_inicio: alumno.fecha_inicio, notas: alumno.notas || '' }
      : { ...empty, plan: planes[0]?.nombre || 'Mensual' }
    )
  }, [alumno, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = (e) => { e.preventDefault(); onSave(form) }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-800 border-l border-slate-700 z-40 transition-transform duration-300 overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">{alumno ? 'Editar alumno' : 'Nuevo alumno'}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Apellido *</label>
                <input value={form.apellido} onChange={e => set('apellido', e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Plan</label>
              <select value={form.plan} onChange={e => set('plan', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {planes.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Fecha de inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Notas</label>
              <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
              {alumno ? 'Guardar cambios' : 'Crear alumno'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default function Alumnos() {
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [inactivos, setInactivos] = useState([])
  const [planes, setPlanes] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [search, setSearch] = useState('')
  const [verInactivos, setVerInactivos] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editAlumno, setEditAlumno] = useState(null)

  const load = async () => {
    const [a, i, p] = await Promise.all([window.api.listarAlumnos(), window.api.listarInactivos(), window.api.listarPlanes()])
    setAlumnos(a)
    setInactivos(i)
    setPlanes(p)
  }

  useEffect(() => { load() }, [])

  const filtered = alumnos.filter(a => {
    const matchSearch = !search || `${a.nombre} ${a.apellido}`.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === 'Todos' || a.estado_cuota === filtro.toLowerCase()
    return matchSearch && matchFiltro
  })

  const handleSave = async (form) => {
    if (editAlumno) await window.api.actualizarAlumno(editAlumno.id, form)
    else await window.api.crearAlumno(form)
    setPanelOpen(false)
    setEditAlumno(null)
    load()
  }

  const handleReactivar = async (e, id) => {
    e.stopPropagation()
    await window.api.reactivarAlumno(id)
    load()
  }

  const handleDarDeBaja = async (e, a) => {
    e.stopPropagation()
    if (!window.confirm(`¿Dar de baja a ${a.nombre} ${a.apellido}?\nSus datos e historial se conservan y puede reactivarse después.`)) return
    await window.api.desactivarAlumno(a.id)
    load()
  }

  const openEdit = (e, a) => { e.stopPropagation(); setEditAlumno(a); setPanelOpen(true) }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Alumnos</h2>
          <p className="text-slate-400 text-sm mt-1">
            {alumnos.length} activos
            {inactivos.length > 0 && <span className="text-slate-600 ml-2">· {inactivos.length} inactivos</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setVerInactivos(v => !v)}
            className={`border text-sm px-4 py-2.5 rounded-lg transition-colors ${verInactivos ? 'border-slate-500 text-white bg-slate-700' : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
          >
            {verInactivos ? 'Ver activos' : `Inactivos${inactivos.length > 0 ? ` (${inactivos.length})` : ''}`}
          </button>
          {!verInactivos && (
            <button onClick={() => { setEditAlumno(null); setPanelOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
              <span className="text-lg">+</span> Nuevo alumno
            </button>
          )}
        </div>
      </div>

      {verInactivos ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Alumno</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Plan</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Inicio</th>
                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Teléfono</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {inactivos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">No hay alumnos inactivos</td></tr>
              ) : inactivos.map(a => (
                <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-slate-300 font-medium">{a.apellido}, {a.nombre}</p>
                    {a.email && <p className="text-slate-500 text-xs mt-0.5">{a.email}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{a.plan}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{a.fecha_inicio}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{a.telefono || '—'}</td>
                  <td className="px-6 py-4">
                    <button onClick={e => handleReactivar(e, a.id)} className="text-green-400 hover:text-green-300 text-sm px-3 py-1 rounded hover:bg-slate-600 transition-colors">
                      Reactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o apellido..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              {FILTROS.map(f => (
                <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Alumno</th>
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Plan</th>
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Inicio</th>
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Cuota</th>
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Teléfono</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">{search ? 'Sin resultados' : 'No hay alumnos registrados'}</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} onClick={() => navigate(`/alumnos/${a.id}`)} className="border-b border-slate-700/50 hover:bg-slate-700/40 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{a.apellido}, {a.nombre}</p>
                      {a.email && <p className="text-slate-500 text-xs mt-0.5">{a.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{a.plan}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{a.fecha_inicio}</td>
                    <td className="px-6 py-4">{a.estado_cuota ? <StatusBadge estado={a.estado_cuota} /> : <span className="text-slate-600 text-xs">Sin cuota</span>}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{a.telefono || '—'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={e => openEdit(e, a)} className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded hover:bg-slate-600 transition-colors">Editar</button>
                      <button onClick={e => handleDarDeBaja(e, a)} className="text-slate-500 hover:text-red-400 text-sm px-3 py-1 rounded hover:bg-slate-600 transition-colors">Baja</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SidePanel open={panelOpen} onClose={() => { setPanelOpen(false); setEditAlumno(null) }} planes={planes} onSave={handleSave} alumno={editAlumno} />
    </div>
  )
}
