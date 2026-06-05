const STYLES = {
  pagado:   { wrap: 'bg-green-900/60 text-green-300',  dot: 'bg-green-400',  label: 'Pagado' },
  pendiente:{ wrap: 'bg-yellow-900/60 text-yellow-300', dot: 'bg-yellow-400', label: 'Pendiente' },
  vencido:  { wrap: 'bg-red-900/60 text-red-300',    dot: 'bg-red-400',    label: 'Vencido' },
}

export default function StatusBadge({ estado }) {
  const s = STYLES[estado] || { wrap: 'bg-slate-700 text-slate-300', dot: 'bg-slate-400', label: estado }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
