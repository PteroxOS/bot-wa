process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("./config");
const {
  useMultiFileAuthState,
  DisconnectReason,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  proto,
  Browsers,
} = await import("@adiwajshing/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const os = require("os");
const yargs = require("yargs/yargs");
const cp = require("child_process");
const lodash = require("lodash");
const syntaxerror = require("syntax-error");
const path = require("path");
const chalk = require("chalk");
const { format } = require("util");

let simple = require("./lib/simple");
var low;
try {
  low = require("lowdb");
} catch (e) {
  low = require("./lib/lowdb");
}
const { Low, JSONFile } = low;
const mongoDB = require("./lib/mongoDB");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

global.API = (name, path = "/", query = {}, apikeyqueryname) => {
  return (
    (name in global.APIs ? global.APIs[name] : name) +
    path +
    (query || apikeyqueryname
      ? "?" +
        new URLSearchParams(
          Object.entries({
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
        )
      : "")
  );
};

global.timestamp = {
  start: new Date(),
};

const PORT = process.env.PORT || 3000;

global.opts = new Object(
  yargs(process.argv.slice(2)).exitProcess(false).parse()
);
global.prefix = new RegExp(
  "^[" +
    (opts["prefix"] || "xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-").replace(
      /[|\\{}()[\]^$+*?.\-\^]/g,
      "\\$&"
    ) +
    "]"
);

global.db = new Low(
  /https?:\/\//.test(opts["db"] || "")
    ? new cloudDBAdapter(opts["db"])
    : /mongodb/.test(opts["db"])
    ? new mongoDB(opts["db"])
    : new JSONFile((opts["_"][0] ? opts["_"][0] + "_" : "") + "database.json")
);

global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(function () {
        if (!global.db.READ) {
          clearInterval(this);
          resolve(
            global.db.data == null ? global.loadDatabase() : global.db.data
          );
        }
      }, 1 * 1000)
    );
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read();
  global.db.READ = false;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    ...(global.db.data || {}),
  };
  global.db.chain = lodash.chain(global.db.data);
};
loadDatabase();

var getBrowser = function (browserName = "Ubuntu") {
  const platform = os.platform();
  const browser =
    platform === "win32"
      ? "Chrome"
      : platform === "darwin"
      ? "MacOS"
      : "Ubuntu";
  const finalBrowserName =
    browser === "Ubuntu" ? Browsers.get(browserName)[2] : browserName;
  return [browser, browserName, finalBrowserName];
};

const authFile = "" + (opts["_"][0] || "sessions");
global.isInit = !fs.existsSync(authFile);
const { state, saveState, saveCreds } = await useMultiFileAuthState(authFile);
const { version, isLatest } = await fetchLatestBaileysVersion();

console.log(
  chalk.magenta(`-- using WA v${version.join(".")}, isLatest: ${isLatest} --`)
);

const msgRetryCounterCache = new simple.MessageRetryMap();
const msgRetryCounterMap = new simple.MessageRetryMap({
  stdTTL: 5 * 60,
  useClones: false,
});

const connectionOptions = {
  printQRInTerminal: !opts["pairing"],
  syncFullHistory: true,
  markOnlineOnConnect: true,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  generateHighQualityLinkPreview: true,
  patchMessageBeforeSending: (message) => {
    const requiresPatch = !!(
      message.buttonsMessage ||
      message.templateMessage ||
      message.listMessage
    );
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      };
    }
    return message;
  },
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      pino({
        level: "silent",
        stream: "store",
      })
    ),
  },
  cachedGroupMetadata: async (jid) => msgRetryCounterMap.get(jid),
  msgRetryCounterCache,
  browser: getBrowser(),
  logger: pino({
    level: "silent",
  }),
  version,
};

global.conn = simple.makeWASocket(connectionOptions);

if (!opts["pairing"]) {
  if (global.db)
    setInterval(async () => {
      if (global.db.data) await global.db.write();
      if (!opts["tmp"] && (global.support || {}).find) {
        tmp = [os.tmpdir(), "tmp"];
        tmp.forEach((dir) =>
          cp.spawn("find", [dir, "-amin", "3", "-type", "f", "-delete"])
        );
      }
    }, 30 * 1000);
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update;
  global.timestamp.connect = new Date();
  if (
    lastDisconnect &&
    lastDisconnect.error &&
    lastDisconnect.error.output &&
    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut &&
    conn.ws.readyState !== WebSocket.CONNECTING
  ) {
    console.log(global.reloadHandler(true));
  }
  if (global.db.data == null) await loadDatabase();
}

if (opts["pairing"] && !conn.authState.creds.registered) {
  console.info(chalk.greenBright("Please wait, generating code..."));
  if (!conn.authState.creds.me) {
    let phoneNumber = "";
    do {
      phoneNumber = await question(
        chalk.blueBright(
          "ENTER A VALID NUMBER START WITH REGION CODE. Example : 62xxx:\n"
        )
      );
      if (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10) {
        console.error(
          chalk.redBright("Invalid phone number. Please enter a valid number.")
        );
      }
    } while (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10);
    rl.close();
    phoneNumber = phoneNumber.replace(/\D/g, "");
    console.log(chalk.bgWhite(chalk.blue("Your Pairing Code : ")));
    setTimeout(async () => {
      let code = await conn.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(chalk.black(chalk.bgGreen(code)));
    }, 3000);
  }
}

process.on("uncaughtException", console.error);

const loadPlugin = (filename) => {
  filename = require.resolve(filename);
  let plugin,
    retries = 0;
  do {
    if (filename in require.cache) delete require.cache[filename];
    plugin = require(filename);
    retries++;
  } while (
    (!plugin || Array.isArray(plugin) || plugin instanceof String
      ? !(plugin || []).length
      : typeof plugin == "object" && !Buffer.isBuffer(plugin)
      ? !Object.keys(plugin || {}).length
      : true) &&
    retries <= 10
  );
  return plugin;
};

let isRunning = true;
global.reloadHandler = function (restatConn) {
  let handler = loadPlugin("./handler");
  if (restatConn) {
    try {
      global.conn.ws.close();
    } catch {}
    global.conn = {
      ...global.conn,
      ...simple.makeWASocket(connectionOptions),
    };
  }
  if (!isRunning) {
    conn.ev.off("messages.upsert", conn.handler);
    conn.ev.off("group-participants.update", conn.participantsUpdate);
    conn.ev.off("message.delete", conn.onDelete);
    conn.ev.off("connection.update", conn.connectionUpdate);
    conn.ev.off("creds.update", conn.credsUpdate);
  }

  conn.welcome =
    "Selamat datang @user di group @subject utamakan baca desk ya \n@desc";
  conn.bye = "Selamat tinggal @user 👋";
  conn.spromote = "@user sekarang admin!";
  conn.sdemote = "@user sekarang bukan admin!";

  conn.handler = handler.handler.bind(conn);
  conn.participantsUpdate = handler.participantsUpdate.bind(conn);
  conn.onDelete = handler.delete.bind(conn);
  conn.connectionUpdate = connectionUpdate.bind(conn);
  conn.credsUpdate = saveCreds.bind(conn);

  conn.ev.on("messages.upsert", conn.handler);
  conn.ev.on("group-participants.update", conn.participantsUpdate);
  conn.ev.on("message.delete", conn.onDelete);
  conn.ev.on("connection.update", conn.connectionUpdate);
  conn.ev.on("creds.update", conn.credsUpdate);

  conn.ev.on("call", async (callUpdate) => {
    console.log("Panggilan diterima:", callUpdate);
    if (callUpdate[0].status === "ringing") {
      await conn.rejectCall(callUpdate[0].id);
      console.log("Panggilan ditolak");
    }
  });

  isRunning = false;
  return true;
};

let pluginFolder = path.join(__dirname, "plugins");
let pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};
for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
  try {
    global.plugins[filename] = require(path.join(pluginFolder, filename));
  } catch (e) {
    conn.logger.error(e);
    delete global.plugins[filename];
  }
}
console.log(Object.keys(global.plugins));

global.reload = (_event, filename) => {
  if (pluginFilter(filename)) {
    let dir = path.join(pluginFolder, filename);
    if (dir in require.cache) {
      delete require.cache[dir];
      if (fs.existsSync(dir))
        conn.logger.info(`re - require plugin '${filename}'`);
      else {
        conn.logger.warn(`deleted plugin '${filename}'`);
        return delete global.plugins[filename];
      }
    } else conn.logger.info(`requiring new plugin '${filename}'`);
    let err = syntaxerror(fs.readFileSync(dir), filename);
    if (err)
      conn.logger.error(`syntax error while loading '${filename}'\n${err}`);
    else
      try {
        global.plugins[filename] = require(dir);
      } catch (e) {
        conn.logger.error(e);
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        );
      }
  }
};
Object.freeze(global.reload);
fs.watch(path.join(__dirname, "plugins"), global.reload);
global.reloadHandler();

async function checkTools() {
  let tools = await Promise.all(
    [
      cp.spawn("ffmpeg"),
      cp.spawn("ffprobe"),
      cp.spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-filter_complex",
        "color",
        "-frames:v",
        "1",
        "-f",
        "webp",
        "-",
      ]),
      cp.spawn("convert"),
      cp.spawn("magick"),
      cp.spawn("gm"),
      cp.spawn("find", ["--version"]),
    ].map((p) => {
      return Promise.race([
        new Promise((resolve) => {
          p.on("close", (code) => {
            resolve(code !== 127);
          });
        }),
        new Promise((resolve) => {
          p.on("error", (_) => resolve(false));
        }),
      ]);
    })
  );

  let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = tools;
  console.log(tools);
  let support = (global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find,
  });
  Object.freeze(global.support);

  if (!support.ffmpeg)
    conn.logger.warn(
      "Please install ffmpeg for sending videos (pkg install ffmpeg)"
    );
  if (support.ffmpeg && !support.ffmpegWebp)
    conn.logger.warn(
      "Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)"
    );
  if (!support.convert && !support.magick && !support.gm)
    conn.logger.warn(
      "Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)"
    );
}

checkTools()
  .catch(() => conn.logger.warn("Quick Test Done"))
  .then(() => console.log("Done"));
