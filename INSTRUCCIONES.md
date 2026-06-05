# Plataforma Administrativa para Gimnasios
## Cómo usar este kit

Este kit construye automáticamente una app desktop para gestionar tu gimnasio: alumnos, cuotas, gastos y un dashboard financiero. No es un template — Claude la construye personalizada con el nombre de tu gimnasio, tu moneda y tus planes.

---

## Qué vas a obtener

Una aplicación instalable en tu PC (Windows, Mac o Linux) con:

- **Alumnos** — alta, edición, búsqueda y filtros por estado de cuota
- **Cuotas** — generación automática mensual, marcado de pagos con método (efectivo / transferencia / tarjeta)
- **Gastos** — registro de egresos por categoría
- **Dashboard** — ingresos cobrados, ingresos esperados, gastos, balance y gráfico de los últimos 6 meses
- Datos guardados localmente en tu PC (sin internet, sin nube, sin suscripción)

---

## Requisitos previos

Antes de empezar, necesitás tener instalado:

1. **Node.js** (versión 18 o superior)
   Descargalo en: https://nodejs.org
   Para verificar: abrí una terminal y escribí `node --version`

2. **Claude Code** (la app de escritorio o extensión de VS Code)
   Descargalo en: https://claude.ai/code

---

## Pasos para usar el kit

### 1. Abrí esta carpeta en Claude Code

- En la app de escritorio: File → Open Folder → seleccioná la carpeta `kit-gimnasio-admin`
- En VS Code: abrí la carpeta y usá el panel de Claude Code

### 2. Escribí cualquier cosa para empezar

Claude te va a saludar y te va a hacer unas pocas preguntas:
- El nombre de tu gimnasio
- La moneda que usás
- Tus planes de cuota y sus precios
- Tus categorías de gasto habituales

No te preocupes si no tenés todo definido — Claude arranca igual y podés editar los datos después desde la app.

### 3. Claude construye la app

Mientras respondés las preguntas, Claude genera todo el código. Al terminar te muestra exactamente qué comandos correr.

### 4. Instalá y abrí la app

```bash
cd gimnasio-app
npm install
npm run dev
```

La primera vez que abrís la app:
→ Andá a **Cuotas** → hacé clic en **"Generar cuotas del mes"**
→ Esto crea las cuotas de todos tus alumnos para el mes actual

### 5. (Opcional) Creá el instalador

Si querés instalarla como cualquier otro programa:

```bash
npm run build
```

El instalador aparece en la carpeta `dist/` (`.exe` en Windows, `.dmg` en Mac).

---

## Preguntas frecuentes

**¿Mis datos están en la nube?**
No. Todo queda guardado en tu PC en un archivo local. Nadie más tiene acceso.

**¿Puedo cambiar los precios de las cuotas después?**
Sí. Los planes y precios se pueden editar desde la configuración de la app.

**¿Funciona en más de una PC?**
La app es por instalación. Si querés usarla en varias PCs, necesitarías copiar el archivo de base de datos entre ellas (o pedir una versión multi-PC).

**¿Qué pasa si se rompe algo?**
Podés volver a abrir esta carpeta en Claude Code y pedirle que arregle el problema.

---

## Soporte

Si algo no funciona, abrí esta carpeta en Claude Code y describí el problema. Claude puede diagnosticarlo y corregirlo directamente en el código.
