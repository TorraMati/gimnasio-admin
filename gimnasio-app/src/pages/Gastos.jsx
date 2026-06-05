import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

function SidePanelGasto({ open, onClose, categorias, onSave, gasto }) {
  const hoy = new Date().toISOString().split('T')[0]
  const empty = { descripcion: '', categoria: categorias[0]?.nombre || '', monto: '', fecha: hoy }
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setForm(gasto
      ? { descripcion: gasto.descripcion, categoria: gasto.categoria, monto: String(gasto.monto), fecha: gasto.fecha }
      : { ...empty, categoria: categorias[0]?.nombre || '' }
    )
  }, [gasto, open, categorias])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = (e) => { e.preventDefault(); onSave({ ...form, monto: parseFloat(form.monto) }) }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-96 bg-slate-800 border-l border-slate-700 z-40 transition-transform duration-300 overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">{gasto ? 'Editar gasto' : 'Registrar gasto'}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Descripción *</label>
              <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Monto *</label>
              <input type="number" min="0" step="0.01" value={form.monto} onChange={e => set('monto', e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
              {gasto ? 'Guardar cambios' : 'Registrar gasto'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

function CategoriasPanel({ open, onClose, categorias, onReload }) {
  const [nueva, setNueva] = useState('')
  const [editId, setEditId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const handleCrear = async () => {
    if (!nueva.trim()) return
    await window.api.crearCategoria(nueva.trim())
    setNueva('')
    onReload()
  }

  const handleEditar = async (id) => {
    if (!editNombre.trim()) return
    await window.api.actualizarCategoria(id, editNombre.trim())
    setEditId(null)
    onReload()
  }

  const handleEliminar = async (id) => {
    await window.api.eliminarCategoria(id)
    setConfirmEliminar(null)
    onReload()
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 z-40 transition-transform duration-300 overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Categorías de gasto</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <div className="flex gap-2 mb-5">
            <input
              value={nueva} onChange={e => setNueva(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
              placeholder="Nueva categoría..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button onClick={handleCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">+</button>
          </div>

          <div className="space-y-2">
            {categorias.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg">
                {editId === c.id ? (
                  <>
                    <input value={editNombre} onChange={e => setEditNombre(e.target.value)} autoFocus className="flex-1 bg-slate-700 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none" />
                    <button onClick={() => handleEditar(c.id)} className="text-green-400 hover:text-green-300 text-sm">✓</button>
                    <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-200 text-sm">{c.nombre}</span>
                    <button onClick={() => { setEditId(c.id); setEditNombre(c.nombre) }} className="text-slate-400 hover:text-blue-400 text-xs transition-colors">Editar</button>
                    <button onClick={() => setConfirmEliminar(c)} className="text-slate-400 hover:text-red-400 text-xs transition-colors">Eliminar</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmEliminar}
        title="Eliminar categoría"
        message={`¿Eliminás "${confirmEliminar?.nombre}"? Los gastos existentes en esta categoría no se borran.`}
        onConfirm={() => handleEliminar(confirmEliminar.id)}
        onCancel={() => setConfirmEliminar(null)}
        danger
      />
    </>
  )
}

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [mes, setMes] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [simbolo, setSimbolo] = useState('$')
  const [panelGasto, setPanelGasto] = useState(false)
  const [panelCategorias, setPanelCategorias] = useState(false)
  const [editGasto, setEditGasto] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const load = async () => {
    const [g, c, cfg] = await Promise.all([window.api.listarGastos(mes), window.api.listarCategorias(), window.api.getConfig()])
    setGastos(g)
    setCategorias(c)
    setSimbolo(cfg.moneda_simbolo || '$')
  }

  useEffect(() => { load() }, [mes])

  const filtered = gastos.filter(g => filtroCategoria === 'Todos' || g.categoria === filtroCategoria)
  const total = filtered.reduce((s, g) => s + g.monto, 0)
  const fmt = (n) => `${simbolo} ${(n || 0).toLocaleString('es-AR')}`

  const handleSaveGasto = async (form) => {
    if (editGasto) await window.api.actualizarGasto(editGasto.id, form)
    else await window.api.crearGasto(form)
    setPanelGasto(false)
    setEditGasto(null)
    load()
  }

  const handleEliminar = async (id) => {
    await window.api.eliminarGasto(id)
    setConfirmEliminar(null)
    load()
  }

  const mesesOpciones = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { val, label: d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Gastos</h2>
          <p className="text-slate-400 text-sm mt-1">Total: <span className="text-red-400 font-medium">{fmt(total)}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setPanelGasto(false); setPanelCategorias(true) }} className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm px-4 py-2.5 rounded-lg transition-colors">
            Categorías
          </button>
          <button onClick={() => { setEditGasto(null); setPanelCategorias(false); setPanelGasto(true) }} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            <span className="text-lg">+</span> Registrar gasto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={mes} onChange={e => setMes(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 capitalize">
          {mesesOpciones.map(m => <option key={m.val} value={m.val} className="capitalize">{m.label}</option>)}
        </select>

        <button onClick={() => setFiltroCategoria('Todos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroCategoria === 'Todos' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
          Todos
        </button>
        {categorias.map(c => (
          <button key={c.id} onClick={() => setFiltroCategoria(c.nombre)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroCategoria === c.nombre ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Descripción</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Categoría</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Monto</th>
              <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Fecha</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-500">No hay gastos registrados para este período</td></tr>
            ) : filtered.map(g => (
              <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 text-white">{g.descripcion}</td>
                <td className="px-6 py-4"><span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">{g.categoria}</span></td>
                <td className="px-6 py-4 text-red-400 font-medium">{fmt(g.monto)}</td>
                <td className="px-6 py-4 text-slate-400 text-sm">{g.fecha}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditGasto(g); setPanelCategorias(false); setPanelGasto(true) }} className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded hover:bg-slate-600 transition-colors">Editar</button>
                    <button onClick={() => setConfirmEliminar(g)} className="text-slate-400 hover:text-red-400 text-sm px-3 py-1 rounded hover:bg-slate-600 transition-colors">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SidePanelGasto open={panelGasto} onClose={() => { setPanelGasto(false); setEditGasto(null) }} categorias={categorias} onSave={handleSaveGasto} gasto={editGasto} />
      <CategoriasPanel open={panelCategorias} onClose={() => setPanelCategorias(false)} categorias={categorias} onReload={load} />
      <ConfirmDialog open={!!confirmEliminar} title="Eliminar gasto" message={`¿Eliminás "${confirmEliminar?.descripcion}"?`} onConfirm={() => handleEliminar(confirmEliminar.id)} onCancel={() => setConfirmEliminar(null)} danger />
    </div>
  )
}
