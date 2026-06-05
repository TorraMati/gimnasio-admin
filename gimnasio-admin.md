# Skill: Plataforma Administrativa para Gimnasios

## Qué hace esta skill
Construye una aplicación desktop completa para la gestión administrativa de gimnasios. Reemplaza Excel con una app instalable que corre localmente: control de alumnos, cuotas, gastos y dashboard financiero. Sin internet, sin servidores, datos 100% locales.

## Stack
- **Electron** — app desktop instalable (Windows/Mac/Linux)
- **React** — interfaz de usuario
- **SQLite** (via `better-sqlite3`) — base de datos local embebida
- **Tailwind CSS** — estilos rápidos y limpios
- **Recharts** — gráficos para el dashboard financiero
- **electron-builder** — empaquetado del instalador

---

## Mensaje de bienvenida

Cuando el usuario active esta skill, mostrar:

> **Vamos a construir tu plataforma de gestión para gimnasio**
>
> Voy a crear una app desktop completa que reemplaza Excel. Funciona sin internet, los datos quedan en tu PC.
>
> Solo necesito algunos datos sobre tu gimnasio para personalizar la app.

---

## Paso 1 — Recopilar datos del gimnasio

Preguntar de forma conversacional (no como formulario). Obtener:

1. **Nombre del gimnasio** — para mostrar en el header y los reportes
2. **Moneda** — ($ ARS / $ USD / € EUR / otra) — para mostrar en cuotas y dashboard
3. **Tipos de cuota** — ej: "Mensual $15.000 / Clase suelta $1.500 / Semestral $80.000"
   - Si el usuario no los sabe aún, usar ejemplos genéricos y avisar que se pueden editar desde la app
4. **Categorías de gasto** — ej: "Alquiler, Servicios, Sueldos, Mantenimiento, Marketing"
   - Si no los sabe, usar categorías predeterminadas: Alquiler, Servicios, Sueldos, Equipamiento, Otros

**Regla:** Con 2 datos mínimos (nombre + moneda) ya se puede construir. No bloquear el proceso por datos faltantes.

---

## Paso 2 — Generar la estructura del proyecto

Crear la siguiente estructura de archivos:

```
gimnasio-app/
├── package.json
├── electron/
│   ├── main.js          # proceso principal de Electron
│   ├── preload.js       # bridge seguro renderer ↔ main
│   └── database.js      # toda la lógica SQLite
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.jsx           # sidebar + header
│   │   ├── StatusBadge.jsx      # badge de estado de cuota
│   │   └── ConfirmDialog.jsx    # diálogo de confirmación reutilizable
│   └── pages/
│       ├── Dashboard.jsx        # métricas y gráficos
│       ├── Alumnos.jsx          # listado + alta/edición de alumnos
│       ├── AlumnoDetalle.jsx    # perfil del alumno + historial de cuotas
│       ├── Cuotas.jsx           # gestión de cobros del mes
│       └── Gastos.jsx           # registro de egresos
├── vite.config.js
├── tailwind.config.js
└── electron-builder.config.js
```

---

## Paso 3 — Base de datos (SQLite)

### Schema completo en `electron/database.js`

```sql
CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  plan TEXT NOT NULL,           -- tipo de cuota que tiene contratada
  fecha_inicio DATE NOT NULL,
  activo INTEGER DEFAULT 1,     -- 1 activo, 0 inactivo
  notas TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cuotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  periodo TEXT NOT NULL,        -- formato 'YYYY-MM' ej: '2025-01'
  monto REAL NOT NULL,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente' | 'pagado' | 'vencido'
  fecha_pago DATETIME,
  metodo_pago TEXT,             -- 'efectivo' | 'transferencia' | 'tarjeta'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  monto REAL NOT NULL,
  fecha DATE NOT NULL,
  comprobante TEXT,             -- path a imagen/PDF opcional
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS planes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT
);
```

Insertar en `config` los valores del gimnasio:
- `nombre_gimnasio` → nombre ingresado por el usuario
- `moneda` → moneda seleccionada
- `moneda_simbolo` → símbolo ($ / € / etc.)

Insertar en `planes` los tipos de cuota ingresados.

---

## Paso 4 — IPC (comunicación Electron)

En `electron/main.js` exponer los handlers IPC necesarios. En `electron/preload.js` crear el bridge seguro con `contextBridge`.

### Handlers requeridos

**Alumnos:**
- `alumnos:listar` → todos los activos (con estado de cuota del mes actual)
- `alumnos:buscar` → búsqueda por nombre/apellido
- `alumnos:crear` → insertar nuevo alumno + generar cuota del mes actual
- `alumnos:actualizar` → editar datos
- `alumnos:desactivar` → soft delete (activo = 0)
- `alumnos:detalle` → alumno + historial completo de cuotas

**Cuotas:**
- `cuotas:mes-actual` → todas las cuotas del período actual con datos del alumno
- `cuotas:marcar-pagado` → actualizar estado + fecha_pago + metodo_pago
- `cuotas:generar-mes` → crear cuotas del mes para todos los alumnos activos (idempotente)
- `cuotas:historial-alumno` → cuotas de un alumno específico

**Gastos:**
- `gastos:listar` → gastos del mes actual (o rango de fechas)
- `gastos:crear` → registrar nuevo gasto
- `gastos:eliminar` → borrar gasto
- `gastos:por-categoria` → agrupado para el dashboard

**Dashboard:**
- `dashboard:resumen-mes` → { ingresos_cobrados, ingresos_esperados, gastos_totales, balance, alumnos_activos, cuotas_pendientes, cuotas_vencidas }
- `dashboard:tendencia-6-meses` → array de 6 meses con ingresos y gastos para el gráfico

---

## Paso 5 — Interfaz de usuario

### Principios de diseño obligatorios
- Sidebar fija a la izquierda con navegación principal
- Colores: fondo oscuro (#0f172a slate-900) con tarjetas en (#1e293b slate-800). Acentos en azul eléctrico o verde para acciones positivas
- Tipografía grande y legible (mínimo 14px en datos, 18px en cifras importantes)
- Números monetarios siempre con separador de miles y símbolo de moneda
- Estados de cuota con badges de color: verde (pagado), amarillo (pendiente), rojo (vencido)
- Sin modales complejos: usar paneles laterales deslizantes (side panel) para formularios
- Botones de acción principales grandes y con icono

### Página: Dashboard
Mostrar en la parte superior 4 tarjetas métricas del mes actual:
1. **Ingresos cobrados** — suma de cuotas pagadas
2. **Ingresos esperados** — suma de cuotas totales del mes
3. **Gastos del mes** — suma de egresos
4. **Balance** — ingresos cobrados − gastos (verde si positivo, rojo si negativo)

Debajo: gráfico de barras con los últimos 6 meses (ingresos vs gastos).

Debajo: resumen rápido — alumnos activos, cuotas pendientes, cuotas vencidas.

### Página: Alumnos
- Tabla con: nombre completo, plan, fecha inicio, estado de cuota del mes, teléfono, acciones
- Barra de búsqueda en tiempo real (filtra mientras escribe)
- Botón "Nuevo alumno" abre side panel con formulario
- Click en fila → va a AlumnoDetalle
- Filtro rápido: Todos / Activos / Con cuota pendiente / Con cuota vencida

### Página: AlumnoDetalle
- Header con nombre, plan, fecha inicio, notas
- Botón editar datos
- Historial completo de cuotas en tabla (periodo, monto, estado, fecha pago, método)
- Posibilidad de marcar cuotas como pagadas desde aquí también

### Página: Cuotas (mes actual)
- Título con el mes y año actual
- Botón "Generar cuotas del mes" (aparece si no están generadas aún)
- Tabla: alumno, plan, monto, estado, fecha de pago, método, acciones
- Acción principal: "Marcar como pagado" → abre mini-formulario inline con método de pago
- Filtros: Todos / Pendientes / Pagados / Vencidos
- Total cobrado vs total esperado visible siempre

### Página: Gastos
- Lista de gastos del mes con: descripción, categoría, monto, fecha
- Botón "Registrar gasto" abre side panel
- Formulario: descripción, categoría (select con las definidas), monto, fecha
- Total de gastos del mes visible siempre
- Filtro por categoría
- Opción de ver gastos de meses anteriores

---

## Paso 6 — Lógica de negocio crítica

### Generación de cuotas
- Al crear un alumno nuevo → generar automáticamente su cuota del mes actual
- Al inicio de cada mes → generar cuotas para todos los alumnos activos
- La función `cuotas:generar-mes` debe ser **idempotente**: si ya existen cuotas para ese período, no duplicar
- El monto de la cuota se toma del precio del plan al momento de generarla

### Estados de cuota
- **Pendiente** → cuota generada, no pagada, fecha dentro del mes
- **Vencida** → cuota generada, no pagada, mes ya pasó
- **Pagada** → registrado el pago con fecha y método

### Marcado automático de vencimientos
Al abrir la app, ejecutar una query para marcar como 'vencido' todas las cuotas con estado 'pendiente' de períodos anteriores al mes actual.

---

## Paso 7 — Configuración de empaquetado

### `package.json` (scripts principales)
```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && electron-builder",
    "preview": "electron ."
  }
}
```

### `electron-builder.config.js`
- productName: nombre del gimnasio (o "GymAdmin" si no se especificó)
- Targets: Windows (NSIS installer), Mac (dmg), Linux (AppImage)
- Incluir el archivo SQLite en los recursos

---

## Paso 8 — Instrucciones de instalación y primer uso

Al finalizar la generación, mostrar:

```
✅ Proyecto generado en: gimnasio-app/

Para empezar:
  cd gimnasio-app
  npm install
  npm run dev

Para crear el instalador:
  npm run build
  → El instalador aparece en la carpeta dist/

Primera vez que abre la app:
  → Ve a Cuotas → "Generar cuotas del mes"
  → Esto crea las cuotas para todos los alumnos activos del mes actual
```

---

## Principios que guían esta skill

1. **No inventa datos** — los planes y categorías se configuran con lo que dijo el usuario
2. **Obtiene automáticamente lo que puede** — detecta el mes actual, genera cuotas automáticamente
3. **Auto-instala dependencias** — el `package.json` incluye todo, `npm install` resuelve todo
4. **Libertad creativa en diseño** — dark theme ejecutivo, no minimalismo aburrido
5. **Se adapta al contexto** — moneda, planes y nombre del gimnasio personalizados
6. **Flujo conversacional** — 4-5 preguntas máximo antes de generar
7. **Fallbacks amigables** — si falta un dato, usa valores predeterminados razonables
8. **Mensaje de bienvenida claro** — el usuario sabe exactamente qué va a obtener
9. **Sin precios sugeridos** — los precios los pone el usuario, no la skill
10. **Resumen claro al terminar** — instrucciones de inicio paso a paso

---

## Qué NO hacer

- No crear un CRUD genérico sin lógica de negocio
- No usar una base de datos en la nube (es local por definición)
- No poner todos los formularios en modales centrados — usar side panels
- No omitir la lógica de generación idempotente de cuotas
- No inventar precios de planes — preguntar siempre
- No crear páginas de configuración complejas en el primer MVP — eso va después
