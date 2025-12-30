process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

(async () => {
  require('./config')

  // ===============================
  // LOGGER
  // ===============================
  const logger = require('./lib/logger')
  logger.banner()
  logger.systemInfo()

  const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
  } = await import('@adiwajshing/baileys')

  const NodeCache = require('node-cache')
  const pino = require('pino')
  const WebSocket = require('ws')
  const path = require('path')
  const fs = require('fs')
  const os = require('os')
  const yargs = require('yargs/yargs')
  const childProcess = require('child_process')
  const lodash = require('lodash')
  const syntaxError = require('syntax-error')
  const chalk = require('chalk')
  const readline = require('readline')

  let simple = require('./lib/simple')

  // ===============================
  // DATABASE
  // ===============================
  let lowdb
  try {
    lowdb = require('lowdb')
  } catch {
    lowdb = require('./lib/lowdb')
  }

  const { Low, JSONFile } = lowdb
  const mongoDB = require('./lib/mongoDB')

  // ===============================
  // CLI
  // ===============================
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const question = q => new Promise(res => rl.question(q, res))

  // ===============================
  // GLOBAL
  // ===============================
  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  global.timestamp = { start: new Date() }

  global.prefix = new RegExp(
    '^[' +
      (opts.prefix ||
        '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-'
      ).replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') +
      ']'
  )

  global.API = (name, path = '/', query = {}, apikey) =>
    (name in global.APIs ? global.APIs[name] : name) +
    path +
    (query || apikey
      ? '?' +
        new URLSearchParams({
          ...query,
          ...(apikey
            ? { [apikey]: global.APIKeys[name] }
            : {})
        })
      : '')

  // ===============================
  // DB INIT
  // ===============================
  global.db = new Low(
    /mongodb/.test(opts.db || '')
      ? new mongoDB(opts.db)
      : new JSONFile((opts._[0] ? opts._[0] + '_' : '') + 'database.json')
  )

  global.loadDatabase = async () => {
    if (global.db.data) return
    await global.db.read()
    global.db.data ||= {
      users: {},
      chats: {},
      stats: {},
      msgs: {},
      sticker: {}
    }
    global.db.chain = lodash.chain(global.db.data)
  }

  await loadDatabase()
  logger.info('Database', 'Loaded')

  // ===============================
  // BAILEYS INIT
  // ===============================
  const sessionPath = '' + (opts._[0] || 'sessions')
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version, isLatest } = await fetchLatestBaileysVersion()

  logger.info(
    'Baileys',
    `WA v${version.join('.')} • Latest: ${isLatest ? 'YES' : 'NO'}`
  )

  const msgRetryCache = new NodeCache()
  const groupCache = new NodeCache({ stdTTL: 300 })

  const getBrowser = (browser = 'Chrome') => {
    const platform = os.platform()
    const system =
      platform === 'win32'
        ? 'Windows'
        : platform === 'darwin'
        ? 'MacOS'
        : 'Linux'
    return Browsers.ubuntu(browser)
  }

  const connectionOptions = {
    printQRInTerminal: false,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: getBrowser(),
    logger: pino({ level: 'silent' }),
    msgRetryCounterCache: msgRetryCache,
    cachedGroupMetadata: jid => groupCache.get(jid)
  }

  global.conn = simple.makeWASocket(connectionOptions)

  // ===============================
  // CONNECTION UPDATE
  // ===============================
  async function connectionUpdate(update) {
    const { connection, lastDisconnect } = update

    if (
      lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut &&
      conn.ws.readyState !== WebSocket.CONNECTING
    ) {
      logger.warn('Reconnecting...')
      global.reloadHandler(true)
    }
  }

  // ===============================
  // PAIRING CODE
  // ===============================
  if (!conn.authState.creds.registered) {
    let phone
    do {
      phone = await question(
        chalk.cyan('INPUT NOMOR (contoh 62xxxx): ')
      )
    } while (!/^\d{10,}$/.test(phone))

    rl.close()
    logger.info('Pairing', 'Generating code...')

    setTimeout(async () => {
      const code = await conn.requestPairingCode(phone)
      logger.info(
        'Pairing Code',
        code.match(/.{1,4}/g).join('-')
      )
    }, 3000)
  }

  // ===============================
  // PLUGIN LOADER
  // ===============================
  global.plugins = {}
  const pluginsDir = path.join(__dirname, 'plugins')

  for (const file of fs.readdirSync(pluginsDir).filter(v => v.endsWith('.js'))) {
    try {
      global.plugins[file] = require(path.join(pluginsDir, file))
    } catch (e) {
      logger.error(`Plugin error: ${file}`)
    }
  }

  logger.info('Plugins', Object.keys(global.plugins).length)

  // ===============================
  // HANDLER RELOAD
  // ===============================
  let isInit = true
  global.reloadHandler = function (restartConn) {
    const handler = require('./handler')

    if (restartConn) {
      try {
        conn.ws.close()
      } catch {}
      global.conn = {
        ...conn,
        ...simple.makeWASocket(connectionOptions)
      }
    }

    if (!isInit) {
      conn.ev.removeAllListeners()
    }

    conn.handler = handler.handler.bind(conn)
    conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = saveCreds.bind(conn)

    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)

    isInit = false
    return true
  }

  global.reloadHandler()

  // ===============================
  // FINAL STATUS
  // ===============================
  console.log(`
${logger.line}
BOT-WA STATUS
• Owner    : Hitam
• Mode     : Multi-Device
• Prefix   : Multi
• Timezone : WIB (Asia/Jakarta)

Gunakan:
- .menu     → menu interaktif
- .menuall  → full command
${logger.line}
`)

  process.on('uncaughtException', err => logger.error(err.message))
})()
