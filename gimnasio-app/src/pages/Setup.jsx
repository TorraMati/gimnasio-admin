import { useState } from 'react'

const MONEDAS = [
  { label: '$ ARS — Peso argentino', simbolo: '$', codigo: 'ARS' },
  { label: '$ USD — Dólar estadounidense', simbolo: '$', codigo: 'USD' },
  { label: '€ EUR — Euro', simbolo: '€', codigo: 'EUR' },
  { label: 'R$ BRL — Real brasileño', simbolo: 'R$', codigo: 'BRL' },
  { label: 'S/ PEN — Sol peruano', simbolo: 'S/', codigo: 'PEN' },
  { label: 'CLP — Peso chileno', simbolo: '$', codigo: 'CLP' },
  { label: 'UYU — Peso uruguayo', simbolo: '$', codigo: 'UYU' },
]

export default function Setup({ onDone }) {
  const [nombre, setNombre] = useState('')
  const [monedaCodigo, setMonedaCodigo] = useState('ARS')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    const moneda = MONEDAS.find(m => m.codigo === monedaCodigo)
    setLoading(true)
    await Promise.all([
      window.api.setConfig('nombre_gimnasio', nombre.trim()),
      window.api.setConfig('moneda', moneda.codigo),
      window.api.setConfig('moneda_simbolo', moneda.simbolo),
      window.api.setConfig('setup_done', '1'),
    ])
    window.api.setWindowTitle(`${nombre.trim()} Admin`)
    onDone()
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-5">🏋️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido</h1>
          <p className="text-slate-400 text-sm">Configurá tu plataforma en un paso</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl border border-slate-700 p-8 space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">¿Cómo se llama tu gimnasio?</label>
            <input
              value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: PowerGym, FitZone, Iron Club..."
              autoFocus required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Moneda</label>
            <select
              value={monedaCodigo} onChange={e => setMonedaCodigo(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              {MONEDAS.map(m => <option key={m.codigo} value={m.codigo}>{m.label}</option>)}
            </select>
          </div>

          <button
            type="submit" disabled={loading || !nombre.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-2"
          >
            {loading ? 'Configurando...' : 'Comenzar →'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-5">Podés cambiar estos datos después desde la app</p>
      </div>
    </div>
  )
}
