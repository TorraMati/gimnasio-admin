const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  listarAlumnos: () => ipcRenderer.invoke('alumnos:listar'),
  buscarAlumnos: (t) => ipcRenderer.invoke('alumnos:buscar', t),
  crearAlumno: (d) => ipcRenderer.invoke('alumnos:crear', d),
  actualizarAlumno: (id, d) => ipcRenderer.invoke('alumnos:actualizar', id, d),
  desactivarAlumno: (id) => ipcRenderer.invoke('alumnos:desactivar', id),
  reactivarAlumno: (id) => ipcRenderer.invoke('alumnos:reactivar', id),
  listarInactivos: () => ipcRenderer.invoke('alumnos:inactivos'),
  detalleAlumno: (id) => ipcRenderer.invoke('alumnos:detalle', id),

  cuotasMesActual: (mes) => ipcRenderer.invoke('cuotas:mes-actual', mes),
  marcarPagado: (id, m) => ipcRenderer.invoke('cuotas:marcar-pagado', id, m),
  generarMes: (mes) => ipcRenderer.invoke('cuotas:generar-mes', mes),
  historialAlumno: (id) => ipcRenderer.invoke('cuotas:historial-alumno', id),

  listarGastos: (mes) => ipcRenderer.invoke('gastos:listar', mes),
  crearGasto: (d) => ipcRenderer.invoke('gastos:crear', d),
  actualizarGasto: (id, d) => ipcRenderer.invoke('gastos:actualizar', id, d),
  eliminarGasto: (id) => ipcRenderer.invoke('gastos:eliminar', id),
  gastosPorCategoria: (mes) => ipcRenderer.invoke('gastos:por-categoria', mes),

  listarCategorias: () => ipcRenderer.invoke('categorias:listar'),
  crearCategoria: (n) => ipcRenderer.invoke('categorias:crear', n),
  actualizarCategoria: (id, n) => ipcRenderer.invoke('categorias:actualizar', id, n),
  eliminarCategoria: (id) => ipcRenderer.invoke('categorias:eliminar', id),

  listarPlanes: () => ipcRenderer.invoke('planes:listar'),
  crearPlan: (d) => ipcRenderer.invoke('planes:crear', d),
  actualizarPlan: (id, d) => ipcRenderer.invoke('planes:actualizar', id, d),
  eliminarPlan: (id) => ipcRenderer.invoke('planes:eliminar', id),

  exportarMes: (periodo) => ipcRenderer.invoke('exportar:mes', periodo),

  resumenMes: (mes) => ipcRenderer.invoke('dashboard:resumen-mes', mes),
  tendencia6Meses: (mes) => ipcRenderer.invoke('dashboard:tendencia-6-meses', mes),

  login: (usuario, password) => ipcRenderer.invoke('auth:login', usuario, password),

  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (clave, valor) => ipcRenderer.invoke('config:set', clave, valor),
  setWindowTitle: (titulo) => ipcRenderer.invoke('window:set-title', titulo),
})
