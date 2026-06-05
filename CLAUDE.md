# Plataforma Administrativa para Gimnasios

Este kit construye una aplicación desktop completa para gestión de gimnasios: alumnos, cuotas, gastos y dashboard financiero. Reemplaza Excel. Funciona sin internet, datos locales.

## Comportamiento al iniciar

Cuando el usuario abra esta carpeta y escriba cualquier cosa, responde exactamente:

> **Bienvenido — vamos a construir tu plataforma de gestión para gimnasio**
>
> Voy a crear una app desktop que reemplaza Excel para administrar tu gimnasio.
> Funciona sin internet y los datos quedan guardados en tu PC.
>
> Solo necesito algunos datos para personalizar la app. ¿Empezamos?

Luego haz las siguientes preguntas de forma conversacional (una o dos a la vez, no como formulario):

1. **¿Cómo se llama tu gimnasio?**
2. **¿Qué moneda usás?** (ej: $ ARS, $ USD, € EUR)
3. **¿Qué planes o tipos de cuota ofrecés?** (ej: Mensual $15.000 / Clase suelta $1.500)
   - Si no los tiene claros todavía: "No hay problema, arrancamos con ejemplos y los editás desde la app"
4. **¿Qué categorías de gasto tenés?** (ej: Alquiler, Sueldos, Servicios)
   - Si no los sabe: usar predeterminados — Alquiler, Sueldos, Servicios, Equipamiento, Otros

Con el nombre y la moneda ya es suficiente para arrancar. No bloquees el proceso esperando datos perfectos.

## Qué generar

Una vez que tengas los datos, seguí las instrucciones completas de la skill en `gimnasio-admin.md` para generar el proyecto completo.

El proyecto se genera en una carpeta `gimnasio-app/` dentro del directorio actual.

Al terminar, mostrá siempre:

```
✅ Tu plataforma está lista en: gimnasio-app/

Para arrancar:
  cd gimnasio-app
  npm install
  npm run dev

Para crear el instalador (.exe / .dmg):
  npm run build

Primera vez que abrís la app:
  → Cuotas → "Generar cuotas del mes"
  → Esto crea las cuotas de todos tus alumnos para el mes actual
```

## Stack técnico

- Electron (app desktop instalable)
- React + Tailwind CSS (interfaz)
- SQLite con better-sqlite3 (base de datos local)
- Recharts (gráficos del dashboard)
- electron-builder (instalador)

## Principios de comportamiento

- Flujo conversacional, no interrogatorio
- Si falta algún dato, usar valores predeterminados razonables
- No inventar precios — siempre preguntarlos al usuario
- No sugerir precios de referencia ni consejos de venta
- Diseño: dark theme ejecutivo, legible, enfocado en datos
- Los formularios usan side panels, no modales centrados
