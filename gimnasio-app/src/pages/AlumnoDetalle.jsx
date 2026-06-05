import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'

const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta']

export default function AlumnoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [simbolo, setSimbolo] = useState('$')
  const [pagoPanel, setPagoPanel] = useState(null)
  const [metodo, setMetodo] = useState('Efectivo')

  const load = async () => {
    const [det, cfg] = await Promise.all([window.api.detalleAlumno(Number(id)), window.api.getConfig()])
    setData(det)
    setSimbolo(cfg.moneda_simbolo || '$')
  }

  useEffect(() => { load() }, [id])

  const fmt = (n) => `${simbolo} ${(n || 0).toLocaleString('es-AR')}`

  const handlePago = async (cuotaId) => {
    await window.api.marcarPagado(cuotaId, metodo)
    setPagoPanel(null)
    load()
  }

  if (!data) return <div className="p-8 text-slate-400">Cargando...</div>
  const { alumno, cuotas } = data

  return (
    <div className="p-8">
      <button onClick={() => navigate('/alumnos')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
        ← Volver a alumnos
      </button>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-3">{alumno.apellido}, {alumno.nombre}</h2>
        <div className="flex flex-wrap gap-5 text-sm text-slate-400">
          <span>Plan: <span className="text-slate-200">{alumno.plan}</span></span>
          {alumno.telefono && <span>Tel: <span className="text-slate-200">{alumno.telefono}</span></span>}
          {alumno.email && <span>Email: <span className="text-slate-200">{alumno.email}</span></span>}
          <span>Desde: <span className="text-slate-200">{alumno.fecha_inicio}</span></span>
        </div>
        {alumno.notas && <p className="mt-3 text-slate-400 text-sm bg-slate-700/50 rounded-lg p-3">{alumno.notas}</p>}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-base font-semibold text-white">Historial de cuotas</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-6 py-3 text-slate-400 text-sm font-medium">Período</th>
              <th className="text-left px-6 py-3 text-slate-400 text-sm font-medium">Monto</th>
              <th className="text-left px-6 py-3 text-slate-400 text-sm font-medium">Estado</th>
              <th className="text-left px-6 py-3 text-slate-400 text-sm font-medium">Fecha pago</th>
              <th className="text-left px-6 py-3 text-slate-400 text-sm font-medium">Método</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cuotas.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Sin historial</td></tr>
            ) : cuotas.map(c => (
              <tr key={c.id} className="border-b border-slate-700/50">
                <td className="px-6 py-4 text-white font-medium">{c.periodo}</td>
                <td className="px-6 py-4 text-slate-200">{fmt(c.monto)}</td>
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
                        <button onClick={() => handlePago(c.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors">OK</button>
                        <button onClick={() => setPagoPanel(null)} className="text-slate-400 hover:text-white text-xs px-1">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setPagoPanel(c.id)} className="text-green-400 hover:text-green-300 text-sm transition-colors">Marcar pagado</button>
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
