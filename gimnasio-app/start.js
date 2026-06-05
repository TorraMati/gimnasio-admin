// Launcher: removes ELECTRON_RUN_AS_NODE before spawning Electron
// This is needed when running inside Electron-based tools (like Claude Code)
// that set ELECTRON_RUN_AS_NODE=1 in the process environment.
const electronPath = require('electron')
const { spawn } = require('child_process')

const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE

const proc = spawn(electronPath, ['.'], { env, stdio: 'inherit', cwd: __dirname })
proc.on('exit', code => process.exit(code || 0))
proc.on('error', err => { console.error('Failed to start Electron:', err); process.exit(1) })
