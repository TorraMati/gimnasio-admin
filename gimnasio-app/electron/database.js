const initSqlJs = require('sql.js')
const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

function hashPwd(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex')
}

const dbPath = path.join(app.getPath('userData'), 'staymax.db')
let db = null

function save() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  const rows = []
  if (params.length) stmt.bind(params)
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function one(sql, params = []) {
  return all(sql, params)[0] || null
}

function run(sql, params = []) {
  db.run(sql, params)
  const changes = db.getRowsModified()
  const lastInsertRowid = one('SELECT last_insert_rowid() as id')?.id || null
  save()
  return { changes, lastInsertRowid }
}

async function init() {
  const SQL = await initSqlJs({
    locateFile: file => app.isPackaged
      ? path.join(process.resourcesPath, file)
      : path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  })

  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, apellido TEXT NOT NULL, telefono TEXT, email TEXT,
    plan TEXT NOT NULL, fecha_inicio DATE NOT NULL, activo INTEGER DEFAULT 1,
    notas TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL, periodo TEXT NOT NULL, monto REAL NOT NULL,
    estado TEXT DEFAULT 'pendiente', fecha_pago DATETIME, metodo_pago TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(alumno_id, periodo)
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL, categoria TEXT NOT NULL, monto REAL NOT NULL,
    fecha DATE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS planes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, precio REAL NOT NULL, descripcion TEXT
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT)`)
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'profe'
  )`)
  try { db.run('ALTER TABLE cuotas ADD COLUMN vencimiento DATE') } catch (e) {}

  if (one('SELECT COUNT(*) as c FROM usuarios').c === 0) {
    db.run('INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)', ['admin', hashPwd('admin1010'), 'admin'])
    db.run('INSERT INTO usuarios (usuario, password, rol) VALUES (?, ?, ?)', ['profe', hashPwd('profe'), 'profe'])
    save()
  }

  if (one('SELECT COUNT(*) as c FROM config').c === 0) {
    db.run("INSERT OR IGNORE INTO config VALUES ('nombre_gimnasio','')")
    db.run("INSERT OR IGNORE INTO config VALUES ('moneda','ARS')")
    db.run("INSERT OR IGNORE INTO config VALUES ('moneda_simbolo','$')")
    db.run("INSERT OR IGNORE INTO config VALUES ('setup_done','0')")
  }
  db.run("INSERT OR IGNORE INTO config VALUES ('setup_done','0')")
  if (one('SELECT COUNT(*) as c FROM planes').c === 0) {
    db.run("INSERT INTO planes (nombre,precio,descripcion) VALUES ('Mensual',0,'Cuota mensual')")
  }
  if (one('SELECT COUNT(*) as c FROM categorias').c === 0) {
    ;['Alquiler','Sueldos','Servicios','Equipamiento','Otros'].forEach(c =>
      db.run('INSERT OR IGNORE INTO categorias (nombre) VALUES (?)', [c])
    )
  }

  save()
}

function getPeriodo() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function marcarVencidos() {
  const hoy = new Date().toISOString().split('T')[0]
  // Cuotas con fecha de vencimiento explícita
  run("UPDATE cuotas SET estado='vencido' WHERE estado='pendiente' AND vencimiento IS NOT NULL AND vencimiento < ?", [hoy])
  // Cuotas viejas sin vencimiento (compatibilidad)
  run("UPDATE cuotas SET estado='vencido' WHERE estado='pendiente' AND vencimiento IS NULL AND periodo < ?", [getPeriodo()])
}

// ALUMNOS
function listarAlumnos() {
  return all(`
    SELECT a.*, c.estado as estado_cuota, c.id as cuota_id, c.monto as cuota_monto
    FROM alumnos a
    LEFT JOIN cuotas c ON c.alumno_id=a.id AND c.periodo=?
    WHERE a.activo=1 ORDER BY a.apellido, a.nombre
  `, [getPeriodo()])
}

function buscarAlumnos(termino) {
  return all(`
    SELECT a.*, c.estado as estado_cuota, c.id as cuota_id, c.monto as cuota_monto
    FROM alumnos a
    LEFT JOIN cuotas c ON c.alumno_id=a.id AND c.periodo=?
    WHERE a.activo=1 AND (a.nombre LIKE ? OR a.apellido LIKE ?)
    ORDER BY a.apellido, a.nombre
  `, [getPeriodo(), `%${termino}%`, `%${termino}%`])
}

function crearAlumno(data) {
  const { nombre, apellido, telefono, email, plan, fecha_inicio, notas } = data
  const r = run(
    'INSERT INTO alumnos (nombre,apellido,telefono,email,plan,fecha_inicio,notas) VALUES (?,?,?,?,?,?,?)',
    [nombre, apellido, telefono||null, email||null, plan, fecha_inicio, notas||null]
  )
  const alumnoId = r.lastInsertRowid
  const planData = one('SELECT precio FROM planes WHERE nombre=?', [plan])
  run('INSERT OR IGNORE INTO cuotas (alumno_id,periodo,monto) VALUES (?,?,?)', [alumnoId, getPeriodo(), planData?.precio || 0])
  return { id: alumnoId }
}

function actualizarAlumno(id, data) {
  const { nombre, apellido, telefono, email, plan, fecha_inicio, notas } = data
  run('UPDATE alumnos SET nombre=?,apellido=?,telefono=?,email=?,plan=?,fecha_inicio=?,notas=? WHERE id=?',
    [nombre, apellido, telefono||null, email||null, plan, fecha_inicio, notas||null, id])
  return { success: true }
}

function desactivarAlumno(id) {
  run('UPDATE alumnos SET activo=0 WHERE id=?', [id])
  return { success: true }
}

function reactivarAlumno(id) {
  run('UPDATE alumnos SET activo=1 WHERE id=?', [id])
  return { success: true }
}

function listarInactivos() {
  return all('SELECT * FROM alumnos WHERE activo=0 ORDER BY apellido, nombre')
}

function detalleAlumno(id) {
  const alumno = one('SELECT * FROM alumnos WHERE id=?', [id])
  const cuotas = all('SELECT * FROM cuotas WHERE alumno_id=? ORDER BY periodo DESC', [id])
  return { alumno, cuotas }
}

// CUOTAS
function cuotasMesActual(mes) {
  const periodo = mes || getPeriodo()
  return all(`
    SELECT c.*, a.nombre, a.apellido, a.plan
    FROM cuotas c JOIN alumnos a ON a.id=c.alumno_id
    WHERE c.periodo=? AND a.activo=1
    ORDER BY c.estado, a.apellido, a.nombre
  `, [periodo])
}

function marcarPagado(id, metodo_pago) {
  run("UPDATE cuotas SET estado='pagado',fecha_pago=?,metodo_pago=? WHERE id=?",
    [new Date().toISOString(), metodo_pago, id])
  return { success: true }
}

function generarMes(mes) {
  const periodo = mes || getPeriodo()
  const [py, pm] = periodo.split('-').map(Number)
  const alumnos = all('SELECT * FROM alumnos WHERE activo=1')
  db.run('BEGIN TRANSACTION')
  let generadas = 0
  for (const a of alumnos) {
    const planData = one('SELECT precio FROM planes WHERE nombre=?', [a.plan])
    const monto = planData?.precio || 0
    // Vencimiento: mismo día de inicio en el mes generado, clampeado al último día del mes
    const diaInicio = new Date(a.fecha_inicio + 'T12:00:00').getDate()
    const ultimoDia = new Date(py, pm, 0).getDate()
    const dia = Math.min(diaInicio, ultimoDia)
    const vencimiento = `${periodo}-${String(dia).padStart(2, '0')}`
    db.run('INSERT OR IGNORE INTO cuotas (alumno_id,periodo,monto,vencimiento) VALUES (?,?,?,?)', [a.id, periodo, monto, vencimiento])
    if (db.getRowsModified() > 0) generadas++
  }
  db.run('COMMIT')
  save()
  return { generadas, periodo }
}

function historialAlumno(alumno_id) {
  return all('SELECT * FROM cuotas WHERE alumno_id=? ORDER BY periodo DESC', [alumno_id])
}

// GASTOS
function listarGastos(mes) {
  const periodo = mes || getPeriodo()
  const [y, m] = periodo.split('-')
  return all('SELECT * FROM gastos WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC',
    [`${y}-${m}-01`, `${y}-${m}-31`])
}

function crearGasto(data) {
  const r = run('INSERT INTO gastos (descripcion,categoria,monto,fecha) VALUES (?,?,?,?)',
    [data.descripcion, data.categoria, data.monto, data.fecha])
  return { id: r.lastInsertRowid }
}

function actualizarGasto(id, data) {
  run('UPDATE gastos SET descripcion=?,categoria=?,monto=?,fecha=? WHERE id=?',
    [data.descripcion, data.categoria, data.monto, data.fecha, id])
  return { success: true }
}

function eliminarGasto(id) {
  run('DELETE FROM gastos WHERE id=?', [id])
  return { success: true }
}

function gastosPorCategoria(mes) {
  const periodo = mes || getPeriodo()
  const [y, m] = periodo.split('-')
  return all('SELECT categoria, SUM(monto) as total FROM gastos WHERE fecha BETWEEN ? AND ? GROUP BY categoria ORDER BY total DESC',
    [`${y}-${m}-01`, `${y}-${m}-31`])
}

// CATEGORIAS
function listarCategorias() { return all('SELECT * FROM categorias ORDER BY nombre') }
function crearCategoria(nombre) {
  const r = run('INSERT OR IGNORE INTO categorias (nombre) VALUES (?)', [nombre])
  return { id: r.lastInsertRowid }
}
function actualizarCategoria(id, nombre) {
  run('UPDATE categorias SET nombre=? WHERE id=?', [nombre, id])
  return { success: true }
}
function eliminarCategoria(id) {
  run('DELETE FROM categorias WHERE id=?', [id])
  return { success: true }
}

// PLANES
function listarPlanes() { return all('SELECT * FROM planes ORDER BY nombre') }
function crearPlan(data) {
  const r = run('INSERT INTO planes (nombre, precio, descripcion) VALUES (?, ?, ?)',
    [data.nombre, data.precio, data.descripcion || null])
  return { id: r.lastInsertRowid }
}
function actualizarPlan(id, data) {
  run('UPDATE planes SET nombre=?,precio=?,descripcion=? WHERE id=?',
    [data.nombre, data.precio, data.descripcion||null, id])
  return { success: true }
}
function eliminarPlan(id) {
  run('DELETE FROM planes WHERE id=?', [id])
  return { success: true }
}

// DASHBOARD
function resumenMes(mes) {
  const periodo = mes || getPeriodo()
  const [y, m] = periodo.split('-')
  const desde = `${y}-${m}-01`, hasta = `${y}-${m}-31`

  const cuotas = one(`
    SELECT
      SUM(CASE WHEN estado='pagado' THEN monto ELSE 0 END) as cobrados,
      SUM(monto) as esperados,
      SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN estado='vencido' THEN 1 ELSE 0 END) as vencidos
    FROM cuotas c JOIN alumnos a ON a.id=c.alumno_id
    WHERE c.periodo=? AND a.activo=1
  `, [periodo])

  const gastos = one('SELECT SUM(monto) as total FROM gastos WHERE fecha BETWEEN ? AND ?', [desde, hasta])
  const alumnos = one('SELECT COUNT(*) as total FROM alumnos WHERE activo=1')
  const cobrados = cuotas?.cobrados || 0
  const gastoTotal = gastos?.total || 0

  return {
    ingresos_cobrados: cobrados,
    ingresos_esperados: cuotas?.esperados || 0,
    gastos_totales: gastoTotal,
    balance: cobrados - gastoTotal,
    alumnos_activos: alumnos?.total || 0,
    cuotas_pendientes: cuotas?.pendientes || 0,
    cuotas_vencidas: cuotas?.vencidos || 0,
  }
}

function tendencia6Meses(mes) {
  const base = mes ? (() => { const [y, m] = mes.split('-').map(Number); return new Date(y, m - 1, 1) })() : new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1)
    const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = periodo.split('-')
    const desde = `${y}-${m}-01`, hasta = `${y}-${m}-31`
    const ingresos = one("SELECT SUM(CASE WHEN estado='pagado' THEN monto ELSE 0 END) as t FROM cuotas WHERE periodo=?", [periodo])
    const gastos = one('SELECT SUM(monto) as t FROM gastos WHERE fecha BETWEEN ? AND ?', [desde, hasta])
    const label = d.toLocaleDateString('es-AR', { month: 'short' })
    return { mes: label.charAt(0).toUpperCase() + label.slice(1), ingresos: ingresos?.t || 0, gastos: gastos?.t || 0 }
  })
}

// AUTH
function login(usuario, password) {
  const user = one('SELECT * FROM usuarios WHERE usuario=? AND password=?', [usuario, hashPwd(password)])
  if (!user) return { success: false }
  return { success: true, rol: user.rol }
}

function getConfig() {
  const rows = all('SELECT * FROM config')
  return Object.fromEntries(rows.map(r => [r.clave, r.valor]))
}

function setConfig(clave, valor) {
  run('INSERT OR REPLACE INTO config (clave, valor) VALUES (?, ?)', [clave, valor])
  return { success: true }
}

module.exports = {
  init, marcarVencidos, listarAlumnos, buscarAlumnos, crearAlumno, actualizarAlumno,
  desactivarAlumno, detalleAlumno, cuotasMesActual, marcarPagado, generarMes,
  historialAlumno, listarGastos, crearGasto, actualizarGasto, eliminarGasto,
  gastosPorCategoria, listarCategorias, crearCategoria, actualizarCategoria,
  eliminarCategoria, listarPlanes, crearPlan, actualizarPlan, eliminarPlan,
  resumenMes, tendencia6Meses, getConfig, setConfig,
  reactivarAlumno, listarInactivos, login,
}
