import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'

const FILTROS = ['Todos', 'Pendientes', 'Pagados', 'Vencidos']
const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta']

function PlanEditor({ planes, onClose, onSaved }) {
  const [editId, setEditId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPrecio, setEditPrecio] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newPrecio, setNewPrecio] = useState('')

  const startEdit = (p) => { setEditId(p.id); setEditNombre(p.nombre); setEditPrecio(String(p.precio)) }

  const save = async (id) => {
    const plan = planes.find(p => p.id === id)
    if (!plan) return
    await window.api.actualizarPlan(id, { nombre: editNombre || plan.nombre, precio: parseFloat(editPrecio) || 0, descripcion: plan.descripcion })
    setEditId(null)
    onSaved()
  }

  const crear = async () => {
    if (!newNombre.trim()) return
    await window.api.crearPlan({ nombre: newNombre.trim(), precio: parseFloat(newPrecio) || 0 })
    setNewNombre(''); setNewPrecio(''); setShowNew(false)
    onSaved()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este plan?')) return
    await window.api.eliminarPlan(id)
    onSaved()
  }

  return (
    <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-300">Planes de cuota</h4>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">Cerrar</button>
      </div>
      {planes.map(p => (
        <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
          {editId === p.id ? (
            <>
              <input
                type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
                placeholder="Nombre del plan"
                className="flex-1 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="text" inputMode="numeric" value={editPrecio} autoFocus
                onChange={e => setEditPrecio(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Precio"
                className="w-32 bg-slate-700 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
              />
              <button onClick={() => save(p.id)} className="text-green-400 hover:text-green-300 text-sm">✓</button>
              <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </>
          ) : (
            <>
              <span className="text-slate-200 text-sm flex-1">{p.nombre}</span>
              <span className="text-slate-400 text-sm">$ {p.precio.toLocaleString('es-AR')}</span>
              <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-blue-400 text-xs transition-colors">Editar</button>
              {planes.length > 1 && (
                <button onClick={() => eliminar(p.id)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">✕</button>
              )}
            </>
          )}
        </div>
      ))}
      {showNew ? (
        <div className="flex items-center gap-3 pt-3 mt-1">
          <input
            type="text" value={newNombre} onChange={e => setNewNombre(e.target.value)} autoFocus
            placeholder="Nombre (ej: 2x semana, Anual...)"
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="text" inputMode="numeric" value={newPrecio}
            onChange={e => setNewPrecio(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Precio"
            className="w-32 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <button onClick={crear} className="text-green-400 hover:text-green-300 text-sm font-medium">Agregar</button>
          <button onClick={() => { setShowNew(false); setNewNombre(''); setNewPrecio('') }} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-xs transition-colors">
          + Agregar plan
        </button>
      )}
    </div>
  )
}

function getPeriodo(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export default function Cuotas() {
  const hoy = new Date()
  const [ano, setAno] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [cuotas, setCuotas] = useState([])
  const [planes, setPlanes] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [simbolo, setSimbolo] = useState('$')
  const [pagoPanel, setPagoPanel] = useState(null)
  const [metodo, setMetodo] = useState('Efectivo')
  const [generando, setGenerando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [showPlanes, setShowPlanes] = useState(false)

  const periodo = getPeriodo(ano, mes)
  const esMesActual = ano === hoy.getFullYear() && mes === hoy.getMonth() + 1

  const load = async () => {
    const [c, p, cfg] = await Promise.all([window.api.cuotasMesActual(getPeriodo(ano, mes)), window.api.listarPlanes(), window.api.getConfig()])
    setCuotas(c)
    setPlanes(p)
    setSimbolo(cfg.moneda_simbolo || '$')
  }

  useEffect(() => { load() }, [ano, mes])

  const irAnterior = () => {
    if (mes === 1) { setAno(a => a - 1); setMes(12) } else setMes(m => m - 1)
  }
  const irSiguiente = () => {
    if (esMesActual) return
    if (mes === 12) { setAno(a => a + 1); setMes(1) } else setMes(m => m + 1)
  }

  const filtered = cuotas.filter(c => {
    if (filtro === 'Pendientes') return c.estado === 'pendiente'
    if (filtro === 'Pagados') return c.estado === 'pagado'
    if (filtro === 'Vencidos') return c.estado === 'vencido'
    return true
  })

  const fmt = (n) => `${simbolo} ${(n || 0).toLocaleString('es-AR')}`
  const totalCobrado = cuotas.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.monto, 0)
  const totalEsperado = cuotas.reduce((s, c) => s + c.monto, 0)

  const handleGenerarMes = async () => {
    setGenerando(true)
    const res = await window.api.generarMes(periodo)
    setGenerando(false)
    load()
    if (res.generadas === 0) alert('Las cuotas del mes ya estaban generadas.')
    else alert(`Se generaron ${res.generadas} cuotas para ${res.periodo}.`)
  }

  const handleExportar = async () => {
    setExportando(true)
    const res = await window.api.exportarMes(periodo)
    setExportando(false)
    if (res.success) alert(`Archivo guardado en:\n${res.path}`)
  }

  const handlePago = async (id) => {
    await window.api.marcarPagado(id, metodo)
    setPagoPanel(null)
    load()
  }

  const titulo = new Date(ano, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white capitalize">Cuotas</h2>
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
              <button onClick={irAnterior} className="px-2 py-0.5 text-slate-400 hover:text-white transition-colors text-sm">‹</button>
              <span className="text-slate-200 text-sm font-medium capitalize px-2 min-w-36 text-center">{titulo}</span>
              <button onClick={irSiguiente} disabled={esMesActual} className="px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors text-sm">›</button>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Cobrado: <span className="text-green-400 font-medium">{fmt(totalCobrado)}</span>
            <span className="text-slate-600 mx-2">·</span>
            Esperado: <span className="text-slate-300 font-medium">{fmt(totalEsperado)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportar} disabled={exportando} className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-50 text-sm px-4 py-2.5 rounded-lg transition-colors">
            {exportando ? 'Exportando...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowPlanes(v => !v)} className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm px-4 py-2.5 rounded-lg transition-colors">
            ⚙ Precios
          </button>
          <button onClick={handleGenerarMes} disabled={generando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
            {generando ? 'Generando...' : 'Generar cuotas del mes'}
          </button>
        </div>
      </div>

      {showPlanes && <PlanEditor planes={planes} onClose={() => setShowPlanes(false)} onSaved={load} />}

      <div className="flex gap-2 my-6">
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Alumno</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Plan</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Monto</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Estado</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Fecha pago</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Método</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  {cuotas.length === 0 ? (
                    <div>
                      <p className="mb-2">No hay cuotas generadas para este mes.</p>
                      <button onClick={handleGenerarMes} className="text-blue-400 hover:text-blue-300 underline text-sm">Generar ahora</button>
                    </div>
                  ) : 'No hay cuotas en esta categoría'}
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{c.apellido}, {c.nombre}</td>
                <td className="px-6 py-4 text-slate-300 text-sm">{c.plan}</td>
                <td className="px-6 py-4 text-slate-200 font-medium">{fmt(c.monto)}</td>
                <td className="px-6 py-4"><StatusBadge estado={c.estado} /></td>
                <td className="px-6 py-4 text-slate-400 text-sm">{c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString('es-AR') : '—'}</td>
                <td className="px-6 py-4 text-slate-400 text-sm capitalize">{c.metodo_pago || '—'}</td>
                <td className="px-6 py-4">
                  {c.estado !== 'pagado' && (
                    pagoPanel === c.id ? (
                      <div className="flex items-center gap-2">
                        <select value={metodo} onChange={e => setMetodo(e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs">
                          {METODOS.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <button onClick={() => handlePago(c.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors">Cobrado</button>
                        <button onClick={() => setPagoPanel(null)} className="text-slate-400 hover:text-white text-xs px-1">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setPagoPanel(c.id)} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium">
                        Cobrar
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
