const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

let db
let win

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  db = require('./database')
  await db.init()
  db.marcarVencidos()
  registerHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerHandlers() {
  ipcMain.handle('alumnos:listar', () => db.listarAlumnos())
  ipcMain.handle('alumnos:buscar', (_, t) => db.buscarAlumnos(t))
  ipcMain.handle('alumnos:crear', (_, d) => db.crearAlumno(d))
  ipcMain.handle('alumnos:actualizar', (_, id, d) => db.actualizarAlumno(id, d))
  ipcMain.handle('alumnos:desactivar', (_, id) => db.desactivarAlumno(id))
  ipcMain.handle('alumnos:reactivar', (_, id) => db.reactivarAlumno(id))
  ipcMain.handle('alumnos:inactivos', () => db.listarInactivos())
  ipcMain.handle('alumnos:detalle', (_, id) => db.detalleAlumno(id))

  ipcMain.handle('cuotas:mes-actual', (_, mes) => db.cuotasMesActual(mes))
  ipcMain.handle('cuotas:marcar-pagado', (_, id, m) => db.marcarPagado(id, m))
  ipcMain.handle('cuotas:generar-mes', (_, mes) => db.generarMes(mes))
  ipcMain.handle('cuotas:historial-alumno', (_, id) => db.historialAlumno(id))

  ipcMain.handle('gastos:listar', (_, mes) => db.listarGastos(mes))
  ipcMain.handle('gastos:crear', (_, d) => db.crearGasto(d))
  ipcMain.handle('gastos:actualizar', (_, id, d) => db.actualizarGasto(id, d))
  ipcMain.handle('gastos:eliminar', (_, id) => db.eliminarGasto(id))
  ipcMain.handle('gastos:por-categoria', (_, mes) => db.gastosPorCategoria(mes))

  ipcMain.handle('categorias:listar', () => db.listarCategorias())
  ipcMain.handle('categorias:crear', (_, n) => db.crearCategoria(n))
  ipcMain.handle('categorias:actualizar', (_, id, n) => db.actualizarCategoria(id, n))
  ipcMain.handle('categorias:eliminar', (_, id) => db.eliminarCategoria(id))

  ipcMain.handle('planes:listar', () => db.listarPlanes())
  ipcMain.handle('planes:crear', (_, d) => db.crearPlan(d))
  ipcMain.handle('planes:actualizar', (_, id, d) => db.actualizarPlan(id, d))
  ipcMain.handle('planes:eliminar', (_, id) => db.eliminarPlan(id))

  ipcMain.handle('exportar:mes', async (_, periodo) => {
    const XLSX = require('xlsx')
    const fs = require('fs')
    const cfg = db.getConfig()
    const cuotas = db.cuotasMesActual(periodo)
    const gastos = db.listarGastos(periodo)

    const totalCobrado = cuotas.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.monto, 0)
    const totalEsperado = cuotas.reduce((s, c) => s + c.monto, 0)
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    const [y, m] = periodo.split('-')
    const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

    const wb = XLSX.utils.book_new()

    const wsResumen = XLSX.utils.aoa_to_sheet([
      [`Resumen ${label} — ${cfg.nombre_gimnasio || 'Gimnasio'}`],
      [],
      ['Concepto', 'Monto'],
      ['Ingresos cobrados', totalCobrado],
      ['Ingresos esperados', totalEsperado],
      ['Gastos totales', totalGastos],
      ['Balance', totalCobrado - totalGastos],
    ])
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    const wsIngresos = XLSX.utils.aoa_to_sheet([
      ['Alumno', 'Plan', 'Monto', 'Estado', 'Fecha de pago', 'Método'],
      ...cuotas.map(c => [
        `${c.apellido}, ${c.nombre}`, c.plan, c.monto, c.estado,
        c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString('es-AR') : '',
        c.metodo_pago || ''
      ]),
      [], ['', 'Total cobrado', totalCobrado], ['', 'Total esperado', totalEsperado],
    ])
    XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos')

    const wsGastos = XLSX.utils.aoa_to_sheet([
      ['Descripción', 'Categoría', 'Monto', 'Fecha'],
      ...gastos.map(g => [g.descripcion, g.categoria, g.monto, g.fecha]),
      [], ['', 'Total', totalGastos],
    ])
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos')

    const result = await dialog.showSaveDialog({
      defaultPath: `StayMax_${periodo}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    fs.writeFileSync(result.filePath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
    return { success: true, path: result.filePath }
  })

  ipcMain.handle('dashboard:resumen-mes', (_, mes) => db.resumenMes(mes))
  ipcMain.handle('dashboard:tendencia-6-meses', (_, mes) => db.tendencia6Meses(mes))

  ipcMain.handle('auth:login', (_, usuario, password) => db.login(usuario, password))

  ipcMain.handle('config:get', () => db.getConfig())
  ipcMain.handle('config:set', (_, clave, valor) => db.setConfig(clave, valor))
  ipcMain.handle('window:set-title', (_, titulo) => { if (win) win.setTitle(titulo) })
}
