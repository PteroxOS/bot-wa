process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
require("./config")

/* ================= LOGGER ================= */

const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
}

/* ================= DEPENDENCIES ================= */

const {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
} = await import("@adiwajshing/baileys")

const pino = require("pino")
const fs = require("fs")
const os = require("os")
const yargs = require("yargs/yargs")
const cp = require("child_process")
const lodash = require("lodash")
const syntaxerror = require("syntax-error")
const path = require("path")
const readline = require("readline")

let simple = require("./lib/simple")
let low
try {
  low = require("lowdb")
} catch {
  low = require("./lib/lowdb")
}

const { Low, JSONFile } = low
const mongoDB = require("./lib/mongoDB")

/* ================= READLINE ================= */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

/* ================= GLOBAL API ================= */

global.API = (name, path = "/", query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? "?" +
      new URLSearchParams({
        ...query,
        ...(apikeyqueryname
          ? {
              [apikeyqueryname]:
                global.APIKeys[
                  name in global.APIs ? global.APIs[name] : name
                ],
            }
          : {}),
      })
    : "")

global.timestamp = { start: new Date() }

/* ================= OPTIONS ================= */

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = new RegExp(
  "^[" +
    (opts.prefix || "xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-").replace(
      /[|\\{}()[\]^$+*?.\-^]/g,
      "\\$&"
    ) +
    "]"
)

/* ================= DATABASE ================= */

global.db = new Low(
  /mongodb/.test(opts.db || "")
    ? new mongoDB(opts.db)
    : new JSONFile((opts._[0] ? opts._[0] + "_" : "") + "database.json")
)

global.loadDatabase = async function () {
  if (global.db.READ) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false

  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    ...(global.db.data || {}),
  }

  global.db.chain = lodash.chain(global.db.data)
}
await loadDatabase()

/* ================= BAILEYS ================= */

const getBrowser = (name = "Ubuntu") => {
  const platform = os.platform()
  const browser =
    platform === "win32"
      ? "Chrome"
      : platform === "darwin"
      ? "MacOS"
      : "Ubuntu"
  return [browser, name, Browsers.get(name)[2]]
}

const authFile = opts._[0] || "sessions"
const { state, saveCreds } = await useMultiFileAuthState(authFile)
const { version, isLatest } = await fetchLatestBaileysVersion()

log.info(`Using WhatsApp v${version.join(".")} | Latest: ${isLatest}`)

const conn = simple.makeWASocket({
  printQRInTerminal: !opts.pairing,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
  },
  browser: getBrowser(),
  logger: pino({ level: "silent" }),
  version,
})

global.conn = conn

/* ================= PAIRING ================= */

if (opts.pairing && !conn.authState.creds.registered) {
  log.info("Pairing mode enabled")

  let phoneNumber = ""
  do {
    phoneNumber = await question("Enter phone number (62xxxx): ")
    if (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10)
      log.error("Invalid number")
  } while (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10)

  rl.close()
  phoneNumber = phoneNumber.replace(/\D/g, "")

  setTimeout(async () => {
    let code = await conn.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join("-") || code
    log.success(`Pairing Code: ${code}`)
  }, 3000)
}

/* ================= CONNECTION UPDATE ================= */

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update
  if (connection) log.info(`Connection: ${connection}`)

  if (
    lastDisconnect &&
    lastDisconnect.error?.output?.statusCode !==
      DisconnectReason.loggedOut
  ) {
    log.warn("Connection lost, restarting")
    global.reloadHandler(true)
  }
}

conn.ev.on("connection.update", connectionUpdate)
conn.ev.on("creds.update", saveCreds)

/* ================= PLUGINS ================= */

const pluginFolder = path.join(__dirname, "plugins")
global.plugins = {}

for (const file of fs.readdirSync(pluginFolder).filter((v) => /\.js$/.test(v))) {
  try {
    global.plugins[file] = require(path.join(pluginFolder, file))
  } catch (e) {
    log.error(`Plugin error ${file}: ${e.message}`)
  }
}

log.info(`Plugins loaded: ${Object.keys(global.plugins).length}`)

/* ================= CALL BLOCK ================= */

conn.ev.on("call", async (call) => {
  log.warn("Incoming call detected")
  if (call[0].status === "ringing") {
    await conn.rejectCall(call[0].id)
    log.info("Call rejected")
  }
})

/* ================= TOOLS CHECK ================= */

async function checkTools() {
  const tools = ["ffmpeg", "ffprobe", "convert", "magick", "gm"]
  for (const tool of tools) {
    try {
      cp.spawnSync(tool)
      log.info(`${tool} available`)
    } catch {
      log.warn(`${tool} not found`)
    }
  }
}

checkTools()
  .then(() => log.success("Startup complete"))
  .catch(() => log.warn("Tool check skipped"))

process.on("uncaughtException", (e) =>
  log.error(`Uncaught Exception: ${e.message}`)
)
