const cluster = require('cluster')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const express = require('express')
const app = express()

/* ================= LOGGER ================= */

const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
}

/* ================= EXPRESS ================= */

const ports = [4000, 3000, 5000, 8000, 8080, 4444]
let availablePortIndex = 0

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      server.close()
      resolve(true)
    })
    server.on('error', reject)
  })
}

async function startServer() {
  const port = ports[availablePortIndex]

  try {
    const isAvailable = await checkPort(port)
    if (isAvailable) {
      log.success(`Server listening on port ${port}`)
      app.get('/', (_, res) => {
        res.json({
          status: true,
          message: 'Bot Successfully Activated',
          author: 'hitam'
        })
      })
    }
  } catch {
    log.warn(`Port ${port} in use, trying next`)
    availablePortIndex++

    if (availablePortIndex >= ports.length) {
      log.error('No available ports found')
      process.exit(1)
    }

    ports[availablePortIndex] = port + 1
    startServer()
  }
}

startServer()

/* ================= BOT PROCESS ================= */

let isRunning = false

function start(file) {
  if (isRunning) return
  isRunning = true

  const args = [path.join(__dirname, file), ...process.argv.slice(2)]
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })

  p.on('message', (data) => {
    log.info(`Child message: ${data}`)
    if (data === 'reset') {
      log.warn('Restart signal received')
      p.kill()
      isRunning = false
      start(file)
    } else if (data === 'uptime') {
      p.send(process.uptime())
    }
  })

  p.on('exit', (code) => {
    isRunning = false
    log.error(`Process exited with code ${code}`)
    if (code !== 0) start('main.js')
  })

  p.on('error', (err) => {
    log.error(`Spawn error: ${err.message}`)
    p.kill()
    isRunning = false
    start('main.js')
  })

  /* ================= PLUGINS ================= */

  const pluginsFolder = path.join(__dirname, 'plugins')
  fs.readdir(pluginsFolder, (err, files) => {
    if (err) return log.error(`Failed to read plugins: ${err.message}`)
    log.info(`Loaded ${files.length} plugins`)

    try {
      const baileys = require('@adiwajshing/baileys/package.json')
      log.info(`Baileys version ${baileys.version}`)
    } catch {
      log.warn('Baileys not installed')
    }
  })

  /* ================= SYSTEM INFO ================= */

  log.info(`OS: ${os.type()} ${os.release()} (${os.arch()})`)
  log.info(`Total RAM: ${(os.totalmem() / 1e9).toFixed(2)} GB`)
  log.info(`Free RAM: ${(os.freemem() / 1e9).toFixed(2)} GB`)
  log.info('Script by trio hitam')
  log.info('Github: https://github.com/PteroxOS/bot-wa')

  setInterval(() => {}, 1000)
}

start('main.js')

/* ================= TMP DIR ================= */

const tmpDir = './tmp'
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir)
  log.info(`Directory created: ${tmpDir}`)
}

/* ================= GLOBAL ERRORS ================= */

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled rejection: ${reason}`)
  start('main.js')
})

process.on('exit', (code) => {
  log.error(`Process exited (${code}), restarting`)
  start('main.js')
})
