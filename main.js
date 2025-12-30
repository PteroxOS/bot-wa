process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

(async () => {
  require('./config');
  
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
    Browsers
  } = await import('@adiwajshing/baileys');
  
  const NodeCache = require('node-cache');
  const pino = require('pino');
  const WebSocket = require('ws');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');
  const yargs = require('yargs/yargs');
  const childProcess = require('child_process');
  const lodash = require('lodash');
  const syntaxError = require('syntax-error');
  const chalk = require('chalk');
  let simple = require('./lib/simple');
  
  var lowdb;
  try {
    lowdb = require('lowdb');
  } catch (e) {
    lowdb = require('./lib/lowdb');
  }
  
  const { Low, JSONFile } = lowdb;
  const mongoDB = require('./lib/mongoDB');
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise(resolve => rl.question(query, resolve));
  
  // Global API helper
  global.API = (name, path = '/', query = {}, apikey) => 
    (name in global.APIs ? global.APIs[name] : name) + path + 
    (query || apikey ? '?' + new URLSearchParams(Object.entries({
      ...query,
      ...(apikey ? { [apikey]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
    })) : '');
  
  global.timestamp = {
    start: new Date()
  };
  
  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
  
  global.prefix = new RegExp('^[' + 
    (opts.prefix || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-')
      .replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');
  
  // Database setup
  global.db = new Low(
    /https?:\/\//.test(opts.db || '') ? 
      new cloudDBAdapter(opts.db) : 
      /mongodb/.test(opts.db) ? 
        new mongoDB(opts.db) : 
        new JSONFile((opts._[0] ? opts._[0] + '_' : '') + 'database.json')
  );
  
  global.DATABASE = global.db;
  
  global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
      return new Promise(resolve => 
        setInterval(function() {
          if (!global.db.READ) {
            clearInterval(this);
            resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
          }
        }, 1000)
      );
    }
    
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
      ...(global.db.data || {})
    };
    global.db.chain = lodash.chain(global.db.data);
  };
  
  loadDatabase();
  
  // Browser configuration
  var getBrowser = function(browser = 'Chrome') {
    const platform = os.platform();
    const system = platform === 'win32' ? 'Windows' : 
                   platform === 'darwin' ? 'MacOS' : 'Linux';
    const release = system === 'Linux' ? Browsers.ubuntu(browser)[2] : 'N/A';
    return [system, browser, release];
  };
  
  const sessionPath = '' + (opts._[0] || 'sessions');
  global.isInit = !fs.existsSync(sessionPath);
  
  const { state, saveState, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  console.log(chalk.magenta(`-- using WA v${version.join('.')}, isLatest: ${isLatest} --`));
  
  const msgRetryCache = new NodeCache();
  const groupCache = new NodeCache({
    stdTTL: 300,
    useClones: false
  });
  
  const connectionOptions = {
    printQRInTerminal: false,
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
                deviceListMetadata: {}
              },
              ...message
            }
          }
        };
      }
      return message;
    },
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().child({
        level: 'silent',
        stream: 'store'
      }))
    },
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    msgRetryCounterCache: msgRetryCache,
    browser: getBrowser(),
    logger: pino({ level: 'silent' }),
    version: version
  };
  
  global.conn = simple.makeWASocket(connectionOptions);
  
  // Auto-save database
  if (!opts.test) {
    if (global.db) {
      setInterval(async () => {
        if (global.db.data) {
          await global.db.write();
        }
        if (!opts.tmp && (global.support || {}).find) {
          tmp = [os.tmpdir(), 'tmp'];
          tmp.forEach(dir => 
            childProcess.spawn('find', [dir, '-amin', '3', '-type', 'f', '-delete'])
          );
        }
      }, 30000);
    }
  }
  
  async function connectionUpdate(update) {
    const { connection, lastDisconnect } = update;
    global.timestamp.connect = new Date();
    
    if (lastDisconnect && lastDisconnect.error && 
        lastDisconnect.error.output && 
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut && 
        conn.ws.readyState !== WebSocket.CONNECTING) {
      console.log(global.reloadHandler(true));
    }
    
    if (global.db.data == null) {
      await loadDatabase();
    }
  }
  
  // Check for existing credentials
  if (fs.existsSync('./sessions/creds.json') && !conn.authState.creds.registered) {
    console.log(chalk.yellow('-- WARNING: creds.json is broken, please delete it first --'));
    process.exit(0);
  }
  
  // Pairing code setup
  if (!conn.authState.creds.registered) {
    let phoneNumber = '';
    
    do {
      phoneNumber = await question(
        chalk.blueBright('ENTER A VALID NUMBER START WITH REGION CODE. Example : 62xxx:\n')
      );
      
      if (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10) {
        console.log(chalk.red("Invalid phone number. Please enter a valid number."));
      }
    } while (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10);
    
    rl.close();
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    console.log(chalk.bgWhite(chalk.blue('-- Please wait, generating code... --')));
    
    setTimeout(async () => {
      let code = 'JEMBDMARK';
      let pairingCode = await conn.requestPairingCode(phoneNumber, code);
      pairingCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
      console.log(
        chalk.black(chalk.bgGreen('Your Pairing Code : ')),
        chalk.black(chalk.white(pairingCode))
      );
    }, 3000);
  }
  
  process.on('uncaughtException', console.error);
  
  // Plugin reloader
  const reloadFile = (file) => {
    file = require.resolve(file);
    let reload;
    let retryCount = 0;
    
    do {
      if (file in require.cache) {
        delete require.cache[file];
      }
      reload = require(file);
      retryCount++;
    } while (
      (!reload || 
       Array.isArray(reload) || 
       reload instanceof String ? 
         !(reload || []).length : 
         typeof reload == 'object' && !Buffer.isBuffer(reload) ? 
           !Object.keys(reload || {}).length : 
           true
      ) && retryCount <= 10
    );
    
    return reload;
  };
  
  let isInit = true;
  
  global.reloadHandler = function(restatConn) {
    let handler = reloadFile('./handler');
    
    if (restatConn) {
      try {
        global.conn.ws.close();
      } catch {}
      
      global.conn = {
        ...global.conn,
        ...simple.makeWASocket(connectionOptions)
      };
    }
    
    if (!isInit) {
      conn.ev.off('messages.upsert', conn.handler);
      conn.ev.off('group-participants.update', conn.participantsUpdate);
      conn.ev.off('message.delete', conn.onDelete);
      conn.ev.off('connection.update', conn.connectionUpdate);
      conn.ev.off('creds.update', conn.credsUpdate);
    }
    
    conn.welcome = 'Selamat datang @user di group @subject utamakan baca desk ya \n@desc';
    conn.bye = 'Selamat tinggal @user 👋';
    conn.promote = '@user sekarang admin!';
    conn.demote = '@user sekarang bukan admin!';
    conn.handler = handler.handler.bind(conn);
    
    conn.ev.on('call', async (call) => {
      console.log('Panggilan diterima:', call);
      if (call.status === 'ringing') {
        await conn.rejectCall(call.id);
        console.log('Panggilan ditolak');
      }
    });
    
    conn.participantsUpdate = handler.participantsUpdate.bind(conn);
    conn.onDelete = handler.delete.bind(conn);
    conn.connectionUpdate = connectionUpdate.bind(conn);
    conn.credsUpdate = saveCreds.bind(conn);
    
    conn.ev.on('messages.upsert', conn.handler);
    conn.ev.on('group-participants.update', conn.participantsUpdate);
    conn.ev.on('message.delete', conn.onDelete);
    conn.ev.on('connection.update', conn.connectionUpdate);
    conn.ev.on('creds.update', conn.credsUpdate);
    
    isInit = false;
    return true;
  };
  
  // Load plugins
  let pluginsFolder = path.join(__dirname, 'plugins');
  let isValidPlugin = (filename) => /\.js$/.test(filename);
  global.plugins = {};
  
  for (let filename of fs.readdirSync(pluginsFolder).filter(isValidPlugin)) {
    try {
      global.plugins[filename] = require(path.join(pluginsFolder, filename));
    } catch (e) {
      conn.logger.error(e);
      delete global.plugins[filename];
    }
  }
  
  console.log(Object.keys(global.plugins));
  
  global.reload = (event, filename) => {
    if (/\.js$/.test(filename)) {
      let dir = path.join(pluginsFolder, filename);
      
      if (dir in require.cache) {
        delete require.cache[dir];
        
        if (fs.existsSync(dir)) {
          conn.logger.info("re - require plugin '" + filename + "'");
        } else {
          conn.logger.warn("deleted plugin '" + filename + "'");
          return delete global.plugins[filename];
        }
      } else {
        conn.logger.info("requiring new plugin '" + filename + "'");
      }
      
      let err = syntaxError(fs.readFileSync(dir), filename);
      
      if (err) {
        conn.logger.error("syntax error while loading '" + filename + "'\n" + err);
      } else {
        try {
          global.plugins[filename] = require(dir);
        } catch (e) {
          conn.logger.error(e);
        } finally {
          global.plugins = Object.freeze(
            Object.fromEntries(
              Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
            )
          );
        }
      }
    }
  };
  
  Object.freeze(global.reload);
  fs.watch(path.join(__dirname, 'plugins'), global.reload);
  global.reloadHandler();
  
  // Check dependencies
  async function checkDependencies() {
    let results = await Promise.all([
      childProcess.spawn('ffmpeg'),
      childProcess.spawn('ffprobe'),
      childProcess.spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-filter_complex', 'color',
        '-frames:v', '1',
        '-f', 'webp',
        '-'
      ]),
      childProcess.spawn('convert'),
      childProcess.spawn('magick'),
      childProcess.spawn('gm'),
      childProcess.spawn('find', ['--version'])
    ].map(proc => {
      return Promise.race([
        new Promise(resolve => {
          proc.on('close', code => {
            resolve(code !== 127);
          });
        }),
        new Promise(resolve => {
          proc.on('error', err => resolve(false));
        })
      ]);
    }));
    
    let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = results;
    
    console.log(results);
    
    let support = global.support = {
      ffmpeg,
      ffprobe,
      ffmpegWebp,
      convert,
      magick,
      gm,
      find
    };
    
    Object.freeze(global.support);
    
    if (!support.ffmpeg) {
      conn.logger.warn('Please install ffmpeg for sending videos (pkg install ffmpeg)');
    }
    
    if (support.ffmpeg && !support.ffmpegWebp) {
      conn.logger.warn(
        'Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)'
      );
    }
    
    if (!support.convert && !support.magick && !support.gm) {
      conn.logger.warn(
        'Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)'
      );
    }
  }
  
  checkDependencies()
    .then(() => conn.logger.info('Quick Test Done'))
    .catch('done');
})();
