# Gimnasio Admin

Aplicación desktop instalable para la administración completa de gimnasios. Funciona 100% offline — sin servidor, sin cuenta, sin internet.

## Funcionalidades

- **Dashboard** — resumen financiero con gráficos de ingresos, gastos y tendencias mensuales
- **Alumnos** — alta, edición, búsqueda y detalle individual por alumno
- **Cuotas** — registro y control de pagos mensuales con estados (al día / vencido / pagado)
- **Gastos** — registro de gastos operativos del gimnasio
- **Autenticación** — login con usuario y contraseña para proteger el acceso
- **Setup inicial** — asistente de configuración en el primer uso
- **Datos locales** — base de datos SQLite embebida, guardada en el equipo del usuario

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Desktop shell | Electron |
| Frontend | React · Tailwind CSS · Recharts |
| Base de datos | SQLite (via sql.js, sin binarios nativos) |
| Bundler | Vite |
| Empaquetado | electron-builder (Windows / Mac / Linux) |

## Instalación para desarrollo

```bash
cd gimnasio-app
npm install
npm run dev        # abre Electron con hot reload
```

**Build instalador:**
```bash
npm run build      # genera instalador en /release
```

## Estructura

```
gimnasio-app/
├── electron/
│   ├── main.js       # proceso principal Electron
│   ├── preload.js    # bridge seguro renderer ↔ main
│   └── database.js   # toda la lógica SQLite
└── src/
    ├── pages/        # Dashboard, Alumnos, AlumnoDetalle, Cuotas, Gastos, Login, Setup
    ├── components/   # Layout, ConfirmDialog, StatusBadge
    └── context/      # AuthContext
```

## Base de datos

La base de datos se guarda automáticamente en el directorio de datos del usuario (`userData` de Electron). No requiere instalación de MySQL ni ningún servidor externo.

---

Desarrollado por [Matias Torrallardona](https://github.com/TorraMati)
