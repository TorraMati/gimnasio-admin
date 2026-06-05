import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function MetricCard({ title, value, subtitle, color }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
      <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}

function getPeriodo(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export default function Dashboard() {
  const hoy = new Date()
  const [ano, setAno] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [resumen, setResumen] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [simbolo, setSimbolo] = useState('$')

  const periodo = getPeriodo(ano, mes)
  const esMesActual = ano === hoy.getFullYear() && mes === hoy.getMonth() + 1

  const load = async () => {
    const p = getPeriodo(ano, mes)
    const [r, t, cfg] = await Promise.all([window.api.resumenMes(p), window.api.tendencia6Meses(p), window.api.getConfig()])
    setResumen(r)
    setTendencia(t)
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

  const fmt = (n) => `${simbolo} ${(n || 0).toLocaleString('es-AR')}`
  const titulo = new Date(ano, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white capitalize">Dashboard</h2>
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
              <button onClick={irAnterior} className="px-2 py-0.5 text-slate-400 hover:text-white transition-colors text-sm">‹</button>
              <span className="text-slate-200 text-sm font-medium capitalize px-2 min-w-36 text-center">{titulo}</span>
              <button onClick={irSiguiente} disabled={esMesActual} className="px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors text-sm">›</button>
            </div>
          </div>
          <p className="text-slate-400 mt-1 text-sm">Resumen financiero del mes</p>
        </div>
      </div>

      {resumen && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <MetricCard title="Ingresos cobrados" value={fmt(resumen.ingresos_cobrados)} subtitle={`de ${fmt(resumen.ingresos_esperados)} esperados`} color="text-green-400" />
            <MetricCard title="Ingresos esperados" value={fmt(resumen.ingresos_esperados)} subtitle="Total cuotas del mes" />
            <MetricCard title="Gastos del mes" value={fmt(resumen.gastos_totales)} color="text-red-400" />
            <MetricCard
              title="Balance"
              value={fmt(resumen.balance)}
              color={resumen.balance >= 0 ? 'text-green-400' : 'text-red-400'}
              subtitle={resumen.balance >= 0 ? 'Positivo ✓' : 'Negativo ✗'}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
              <p className="text-4xl font-bold text-blue-400">{resumen.alumnos_activos}</p>
              <p className="text-slate-400 text-sm mt-2">Alumnos activos</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
              <p className="text-4xl font-bold text-yellow-400">{resumen.cuotas_pendientes}</p>
              <p className="text-slate-400 text-sm mt-2">Cuotas pendientes</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
              <p className="text-4xl font-bold text-red-400">{resumen.cuotas_vencidas}</p>
              <p className="text-slate-400 text-sm mt-2">Cuotas vencidas</p>
            </div>
          </div>
        </>
      )}

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6 capitalize">6 meses — hasta {titulo}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={tendencia} barGap={4}>
            <XAxis dataKey="mes" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `${simbolo}${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={v => [fmt(v)]}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
