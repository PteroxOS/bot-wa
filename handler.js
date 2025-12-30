const simple = require('./lib/simple')
const util = require('util')

global.opts = global.opts || {}
global.opts.self = false
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))
// === WAIT/ERROR helper ===
const path = require('path')

const WAIT_STK  = path.join(__dirname, 'media', 'sticker', 'wait.webp')
const ERROR_STK = path.join(__dirname, 'media', 'sticker', 'error.webp')

// handler.js
async function sendWait(conn, m) {
}
// ==== helper: kirim stiker "error" + teks ====
async function sendError(conn, m, text) {
  try {
    if (fs.existsSync(ERROR_STK)) {
      await conn.sendMessage(m.chat, { sticker: { url: ERROR_STK } }, { quoted: m })
    }
  } catch { /* abaikan error baca file */ }

  // selalu kirim teks juga
  const msg = text || global.eror || 'Terjadi kesalahan, coba lagi nanti.'
  await m.reply(msg)
}

module.exports = {
    async handler(chatUpdate) {
        if (global.db.data == null) await loadDatabase()
        this.msgqueque = this.msgqueque || []
        // console.log(chatUpdate)
        if (!chatUpdate) return
        // if (chatUpdate.messages.length > 2 || !chatUpdate.messages.length) return
        if (chatUpdate.messages.length > 1) console.log(chatUpdate.messages)
        let m = chatUpdate.messages[chatUpdate.messages.length - 1]
        if (!m) return
        //console.log(JSON.stringify(m, null, 4))
        try {
            m = await simple.smsg(this, m) || m
if (!m) return

            // ==================================
// INTERACTIVE RESPONSE NORMALIZER
// ==================================
if (m.message?.interactiveResponseMessage) {
  const params =
    m.message.interactiveResponseMessage
      .nativeFlowResponseMessage
      ?.paramsJson

  if (params) {
    try {
      const data = JSON.parse(params)
      if (data.id) {
        m.text = data.id
        m.body = data.id
        m.msg = { text: data.id }
      }
    } catch (e) {}
  }
}

if (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
  const id = m.message.listResponseMessage.singleSelectReply.selectedRowId
  m.text = id
  m.body = id
  m.msg = { text: id }
}
            
// === GLOBAL ANTISPAM COOLDOWN (group) ===
global.__ANTISPAM_COOLDOWN = global.__ANTISPAM_COOLDOWN || {}

if (m.isGroup && global.__ANTISPAM_COOLDOWN[m.chat] && Date.now() < global.__ANTISPAM_COOLDOWN[m.chat]) {
    return // bot diem selama cooldown
}
            if (!m) return
            // console.log(m)
            m.exp = 0
            m.limit = false
            try {
                let user = global.db.data.users[m.sender]
                if (typeof user !== 'object') global.db.data.users[m.sender] = {}
                if (user) {
                    if (!'Banneduser' in user) user.Banneduser = false
                    if (!'BannedReason' in user) user.BannedReason = ''
                    if (!isNumber(user.warn)) user.warn = 0
                    if (!('banned' in user)) user.banned = false
                    if (!isNumber(user.bannedTime)) user.bannedTime = 0
        
                    if (!isNumber(user.afk)) user.afk = -1
                    if (!'afkReason' in user) user.afkReason = ''
                
                
        
                    if (!isNumber(user.antispam)) user.antispam = 0
                    if (!isNumber(user.antispamlastclaim)) user.antispamlastclaim = 0
        
                    
                      if (!('registered' in user)) user.registered = false
                      if (!user.registered) {
                      if (!('name' in user)) user.name = this.getName(m.sender)
                      //sambung kata
                      if (!isNumber(user.skata)) user.skata = 0
        
                      
                      if (!isNumber(user.age)) user.age = -1
                      if (!isNumber(user.premiumDate)) user.premiumDate = -1
                      if (!isNumber(user.regTime)) user.regTime = -1
                        
        }
                      

                  } else global.db.data.users[m.sender] = {
                      limit: 10,
                      skata: 0,
                      Banneduser: false,
                      BannedReason: '',
                      banned: false, 
                      bannedTime: 0,
                      warn: 0,
                      afk: -1,
                      afkReason: '',
                      anakkucing: 0,
                      antispam: 0,
                      antispamlastclaim: 0,
                      lastturu: 0,
                      lastseen: 0,
                      lastSetStatus: 0,
                      registered: false,
                      name: this.getName(m.sender),
                      age: -1,
                      regTime: -1,
                      premiumDate: -1, 
                      premium: false,
                      premiumTime: 0,
                      vip: 'tidak', 
                      vipPoin: 0,
                      role: 'Pemula', 
                      registered: false,
                      name: this.getName(m.sender),
                      age: -1,
                      regTime: -1,
                      autolevelup: true,
                      lastIstigfar: 0,
                  }
             let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
            if (chat) {
                if (!('isBanned' in chat)) chat.isBanned = false
                if (!('welcome' in chat)) chat.welcome = true
                if (!isNumber(chat.welcometype)) chat.welcometype = 1
                if (!('detect' in chat)) chat.detect = false
                if (!('isBannedTime' in chat)) chat.isBannedTime = false
                if (!('mute' in chat)) chat.mute = false
                if (!('listStr' in chat)) chat.listStr = {}
                if (!('sWelcome' in chat)) chat.sWelcome = 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc'
                if (!('sBye' in chat)) chat.sBye = 'Selamat tinggal @user!'
                if (!('sPromote' in chat)) chat.sPromote = ''
                if (!('sDemote' in chat)) chat.sDemote = ''
                if (!('delete' in chat)) chat.delete = true
                if (!('antiLink' in chat)) chat.antiLink = true
                if (!('antiLinknokick' in chat)) chat.antiLinknokick = false
                if (!('antiSticker' in chat)) chat.antiSticker = false
                if (!('antiStickernokick' in chat)) chat.antiStickernokick = false
                if (!('viewonce' in chat)) chat.viewonce = false
                if (!('antiToxic' in chat)) chat.antiToxic = false
                if (!isNumber(chat.expired)) chat.expired = 0
                if (!("memgc" in chat)) chat.memgc = {}
                if (!('antilinkig' in chat)) chat.antilinkig = false
                if (!('antilinkignokick' in chat)) chat.antilinkignokick = false
                if (!('antilinkfb' in chat)) chat.antilinkfb = false
                if (!('antilinkfbnokick' in chat)) chat.antilinkfbnokick = false
                if (!('antilinktwit' in chat)) chat.antilinktwit = false
                if (!('antilinktwitnokick' in chat)) chat.antilinktwitnokick = false
                if (!('antilinkyt' in chat)) chat.antilinkyt = false
                if (!('antilinkytnokick' in chat)) chat.antilinkytnokick = false
                if (!('antilinktele' in chat)) chat.antilinktele = false
                if (!('antilinktelenokick' in chat)) chat.antilinktelenokick = false
                if (!('antilinkwame' in chat)) chat.antilinkwame = false
                if (!('antilinkwamenokick' in chat)) chat.antilinkwamenokick = false
                if (!('antilinkall' in chat)) chat.antilinkall = false
                if (!('antilinkallnokick' in chat)) chat.antilinkallnokick = false
                if (!('antilinktt' in chat)) chat.antilinktt = false
                if (!('antilinkttnokick' in chat)) chat.antilinkttnokick = false
                if (!('antibot' in chat)) chat.antibot = false
            } else global.db.data.chats[m.chat] = {
                isBanned: false,
                welcome: true,
                welcometype: 1,
                detect: false,
                isBannedTime: false,
                mute: false,
                listStr: {},
                sWelcome: 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc',
                sBye: 'Selamat tinggal @user!',
                sPromote: '',
                sDemote: '',
                delete: false, 
                antiLink: false,
                antiLinknokick: false,
                antiSticker: false, 
                antiStickernokick: false, 
                viewonce: false,
                antiToxic: true,
                antilinkig: false, 
                antilinkignokick: false, 
                antilinkyt: false, 
                antilinkytnokick: false, 
                antilinktwit: false, 
                antilinktwitnokick: false, 
                antilinkfb: false, 
                antilinkfbnokick: false, 
                antilinkall: false, 
                antilinkallnokick: false, 
                antilinkwame: false,
                antilinkwamenokick: false, 
                antilinktele: false, 
                antilinktelenokick: false, 
                antilinktt: false, 
                antilinkttnokick: false, 
                antibot: false, 
                rpg: false, 
            }
            let memgc = global.db.data.chats[m.chat]?.memgc?.[m.sender];
            if (typeof memgc !== 'object' || memgc === null) {
                global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
                global.db.data.chats[m.chat].memgc = global.db.data.chats[m.chat].memgc || {};
                global.db.data.chats[m.chat].memgc[m.sender] = {};
                memgc = global.db.data.chats[m.chat].memgc[m.sender];
            }
            if (memgc) {
                if (!('blacklist' in memgc)) memgc.blacklist = false;
                if (!('banned' in memgc)) memgc.banned = false;
                if (!isNumber(memgc.bannedTime)) memgc.bannedTime = 0;
                if (!isNumber(memgc.chat)) memgc.chat = 0;
                if (!isNumber(memgc.chatTotal)) memgc.chatTotal = 0;
                if (!isNumber(memgc.command)) memgc.command = 0;
                if (!isNumber(memgc.commandTotal)) memgc.commandTotal = 0;
                if (!isNumber(memgc.lastseen)) memgc.lastseen = 0;
            } else {
                global.db.data.chats[m.chat].memgc[m.sender] = {
                    blacklist: false,
                    banned: false,
                    bannedTime: 0,
                    chat: 0,
                    chatTotal: 0,
                    command: 0,
                    commandTotal: 0,
                    lastseen: 0
                };
            }
            } catch (e) {
                console.error(e);
            }
            if (opts['nyimak']) return
            const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
            const ownerNumbers = global.owner.map(v => v.replace(/[^0-9]/g, '')); 
            const mappedOwners = ownerNumbers.map(v => v + detectwhat); 
            //console.log('DEBUG: mappedOwners (JID format for comparison):', mappedOwners);
            const isROwner = mappedOwners.includes(m.sender);
            const isOwner = isROwner || m.fromMe
            const isMods = isROwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + detectwhat).includes(m.sender)
            const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + detectwhat).includes(m.sender) || (db.data.users[m.sender].premiumTime > 0 || db.data.users[m.sender].premium === true);           
            async function getLidFromJid(id, conn) {
                if (id.endsWith('@lid')) return id
                const res = await conn.onWhatsApp(id).catch(() => [])
                return res[0]?.lid || id
            }   
            global.getLidFromJid = getLidFromJid;
            const senderLid = await getLidFromJid(m.sender, this)
            const botLid = await getLidFromJid(this.user.jid, this)
            const senderJid = m.sender
            const botJid = this.user.jid
            const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
            const participants = m.isGroup ? (groupMetadata.participants || []) : []
            const normalize = jid =>
  jid ? jid.replace(/[^0-9]/g, '') : null

const senderNum = normalize(m.sender)

const user =
  participants.find(p => {
    const pNum =
      p.phoneNumber
        ? normalize(p.phoneNumber)
        : p.id
        ? normalize(p.id)
        : p.lid
        ? normalize(p.lid)
        : null

    return pNum === senderNum
  }) || {}
            const bot = participants.find(p => p.id === botLid || p.id === botJid) || {}
const botNum = normalize(this.user?.jid)

const getParticipantNumber = p => {
  if (p.phoneNumber) return normalize(p.phoneNumber)
  if (p.id) return normalize(p.id)
  if (p.lid) return normalize(p.lid)
  return null
}

const isAdmin = m.isGroup
  ? participants.some(p => {
      const pNum = getParticipantNumber(p)
      return (
        pNum === senderNum &&
        (p.admin === 'admin' || p.admin === 'superadmin')
      )
    })
  : false

const isBotAdmin = m.isGroup
  ? participants.some(p => {
      const pNum = getParticipantNumber(p)
      return (
        pNum === botNum &&
        (p.admin === 'admin' || p.admin === 'superadmin')
      )
    })
  : false

            if (opts.self && !isOwner) return
if (opts.pconly && m.chat.endsWith('g.us')) return
if (opts.gconly && !m.chat.endsWith('g.us')) return
if (opts.swonly && m.chat !== 'status@broadcast') return
            if (typeof m.text !== 'string') m.text = ''
            if (opts['queque'] && m.text) {
                this.msgqueque.push(m.id || m.key.id)
                await delay(this.msgqueque.length * 1000)
            }
            for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (!plugin.all) continue
                if (typeof plugin.all !== 'function') continue
                try {
                    await plugin.all.call(this, m, chatUpdate)
                } catch (e) {
                    if (typeof e === 'string') continue
                    console.error(e)
                }
            }
        //if (m.id.startsWith('BAE5') && m.id.length === 16 || m.isBaileys && m.fromMe) return
	if (m.id.startsWith('3EB0') || (m.id.startsWith('BAE5') && m.id.length === 16 || m.isBaileys && m.fromMe)) return;	
            m.exp += Math.ceil(Math.random() * 10)

            let usedPrefix
            let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

            for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (!opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) {
                    // global.dfail('restrict', m, this)
                    continue
                }
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
                let match = (_prefix instanceof RegExp ? // RegExp Mode?
                    [[_prefix.exec(m.text), _prefix]] :
                    Array.isArray(_prefix) ? // Array?
                        _prefix.map(p => {
                            let re = p instanceof RegExp ? // RegExp in Array?
                                p :
                                new RegExp(str2Regex(p))
                            return [re.exec(m.text), re]
                        }) :
                        typeof _prefix === 'string' ? // String?
                            [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                            [[[], new RegExp]]
                ).find(p => p[1])
                if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                })) continue
                if (typeof plugin !== 'function') continue
                if ((usedPrefix = (match[0] || '')[0])) {
                    let noPrefix = m.text.replace(usedPrefix, '')
                    let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                    args = args || []
                    let _args = noPrefix.trim().split` `.slice(1)
                    let text = _args.join` `
                    command = (command || '').toLowerCase()
                    let fail = plugin.fail || global.dfail // When failed
                    let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                        plugin.command.test(command) :
                        Array.isArray(plugin.command) ? // Array?
                            plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                                cmd.test(command) :
                                cmd === command
                            ) :
                            typeof plugin.command === 'string' ? // String?
                                plugin.command === command :
                                false

                    if (!isAccept) continue
                    m.plugin = name
                    if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                        let chat = global.db.data.chats[m.chat]
                        let user = global.db.data.users[m.sender]
                        if (name != 'group-modebot.js' && name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tool-delete.js' && (chat?.isBanned || chat?.mute))
                        return
                        if (name != 'unbanchat.js' && chat && chat.isBanned) return // Except this
                        if (name != 'unbanuser.js' && user && user.banned) return
                        if (m.isGroup) {
                            chat.memgc[m.sender].command++
                            chat.memgc[m.sender].commandTotal++
                            chat.memgc[m.sender].lastCmd = Date.now()
                        }
                        user.command++
                        user.commandTotal++
                        user.lastCmd = Date.now()
                    }
                    
                    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.rowner && !isROwner) { // Real Owner
                        fail('rowner', m, this)
                        continue
                    }
                    if (plugin.owner && !isOwner) { // Number Owner
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.mods && !isMods) { // Moderator
                        fail('mods', m, this)
                        continue
                    }
                    if (plugin.premium && !isPrems) { // Premium
                        fail('premium', m, this)
                        continue
                    }
                    if (plugin.group && !m.isGroup) { // Group Only
                        fail('group', m, this)
                        continue
                    } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                        fail('botAdmin', m, this)
                        continue
                    } else if (plugin.admin && !isAdmin) { // User Admin
                        fail('admin', m, this)
                        continue
                    }
                    if (plugin.private && m.isGroup) { // Private Chat Only
                        fail('private', m, this)
                        continue
                    }
                    if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                        fail('unreg', m, this)
                        continue
                    }
                    m.isCommand = true
                    let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                    if (xp > 200) m.reply('Ngecit -_-') // Hehehe
                    else m.exp += xp
                    if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                        this.reply(m.chat, `
╭───「 ⚠️ *𝙻𝙸𝙼𝙸𝚃 𝙺𝙰𝙼𝚄 𝙷𝙰𝙱𝙸𝚂* 」
│
│ *𝙽𝚘𝚝𝚎: 𝙻𝚒𝚖𝚒𝚝 𝙶𝚛𝚊𝚝𝚒𝚜 𝚛𝚎𝚜𝚎𝚝 𝚜𝚎𝚝𝚒𝚊𝚙 𝚓𝚊𝚖 𝟶𝟶:𝟶𝟶* ( 𝟷𝟶 𝙻𝚒𝚖𝚒𝚝 )
│
│ 🔁 𝙱𝚎𝚕𝚒 𝚛𝚘𝚕𝚎 𝚙𝚛𝚎𝚖𝚒𝚞𝚖 𝚋𝚒𝚜𝚊 𝚊𝚔𝚜𝚎𝚜 𝚏𝚒𝚝𝚞𝚛 𝙰𝙸 𝚍𝚊𝚗 𝚜𝚎𝚖𝚞𝚊 𝚏𝚒𝚝𝚞𝚛 𝚋𝚎𝚛𝚕𝚘𝚐𝚘 "𝚙"
│ 👤 𝙰𝚝𝚊𝚞 𝚌𝚘𝚋𝚊 𝚌𝚑𝚊𝚝 .𝚘𝚠𝚗𝚎𝚛 𝚜𝚒𝚊𝚙𝚊 𝚝𝚊𝚞 𝚍𝚒𝚔𝚊𝚜𝚒 𝚕𝚒𝚖𝚒𝚝 𝚐𝚛𝚊𝚝𝚒𝚜
│ 📝 𝚂𝚌𝚛𝚒𝚙𝚝 𝚒𝚗: ${global.web}
│ 🎁 𝙺𝚎𝚝𝚒𝚔 .𝚌𝚕𝚊𝚒𝚖 (𝙺𝚊𝚕𝚊𝚞 𝚑𝚊𝚛𝚒 𝚒𝚗𝚒 𝚋𝚎𝚕𝚞𝚖 𝚌𝚕𝚊𝚒𝚖 𝚕𝚒𝚖𝚒𝚝 𝚐𝚛𝚊𝚝𝚒𝚜)
╰───────────────────────
`, m)
                        continue // Limit habis
                    }
                    if (plugin.level > _user.level) {
                        this.reply(m.chat, `
╭───「 ⚠️ *LIMIT HABIS* 」
│
│ 💬 *Limit harian kamu sudah habis!*
│ _Note: Limit Gratis reset setiap jam 00:00 ( 10 Limit )_
│
│ 🔁 Beli limit dengan perintah:
│ ➤ *${usedPrefix}sewa* atau *${usedPrefix}owner*
│
│ 🎁 Belum claim bonus limit hari ini? ketik .claimlimit
│
╰───────────────────────
`, m)
                        continue // If the level has not been reached
                    }
                    let extra = {
                        match,
                        usedPrefix,
                        noPrefix,
                        _args,
                        args,
                        command,
                        text,
                        conn: this,
                        participants,
                        groupMetadata,
                        user,
                        bot,
                        isROwner,
                        isOwner,
                        isAdmin,
                        isBotAdmin,
                        isPrems,
                        chatUpdate,
                    }                          
                    try {
                        await sendWait(this, m)    // <<< ini tahap 1
                        await plugin.call(this, m, extra)
                        if (!isPrems) m.limit = m.limit || plugin.limit || false
                    } catch (e) {
                        // Error occured
                        m.error = e
                        console.error(e)
                        if (e) {
                            let text = util.format(e)
                            for (let key of Object.values(APIKeys))
                                text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                            if (e.name)
                            for (let jid of owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').filter(v => v != this.user.jid)) {
                                let data = (await this.onWhatsApp(jid))[0] || {}
                                if (data.exists)
                                    m.reply(
  `❌ *Plugin Error*
Plugin: ${m.plugin}
Command: ${usedPrefix}${command}

\`\`\`${text}\`\`\``,
  m.chat
)
                            }
                            await sendError(this, m, text)
                        }
                    } finally {
                        // m.reply(util.format(_user))
                        if (typeof plugin.after === 'function') {
                            try {
                                await plugin.after.call(this, m, extra)
                            } catch (e) {
                                console.error(e) //>>> ini tahap 3
                            }
                        }
                        // notif pemakaian limit (tanpa bergantung pada m.limit)
if (!isPrems && plugin.limit) {
  const usedLimit = plugin.limit === true ? 1 : Math.max(1, Number(plugin.limit) || 0)
    // 🔽 Tambahkan ini untuk potong limit real
  let user = global.db.data.users[m.sender]
  if (user) user.limit = Math.max(0, (user.limit || 0) - usedLimit)
  await m.reply(
    `[ ${usedLimit} ] *𝙻𝙸𝙼𝙸𝚃 𝙳𝙸𝙶𝚄𝙽𝙰𝙺𝙰𝙽!*\n𝚂𝚎𝚕𝚊𝚕𝚞 𝚌𝚎𝚔 𝚜𝚒𝚜𝚊 𝚕𝚒𝚖𝚒𝚝 𝚔𝚊𝚖𝚞.\n𝚃𝚢𝚙𝚎: *.𝚕𝚒𝚖𝚒𝚝*`
  )
}
                   }
                    break
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
             //conn.sendPresenceUpdate('composing', m.chat) // kalo pengen auto vn hapus // di baris dekat conn
            //console.log(global.db.data.users[m.sender])
            let user, stats = global.db.data.stats
            if (m) {
                if (m.sender && (user = global.db.data.users[m.sender])) {
                    user.exp += m.exp
                }

                let stat
                if (m.plugin) {
                    let now = + new Date
                    if (m.plugin in stats) {
                        stat = stats[m.plugin]
                        if (!isNumber(stat.total)) stat.total = 1
                        if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                        if (!isNumber(stat.last)) stat.last = now
                        if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                    } else stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                    stat.total += 1
                    stat.last = now
                    if (m.error == null) {
                        stat.success += 1
                        stat.lastSuccess = now
                    }
                }
            }

            try {
                 require('./lib/print')(m, this)
             } catch (e) {
                 console.log(m, m.quoted, e)
             }
            if (opts['autoread']) await this.readMessages([m.key])
        }
    },
	
    async participantsUpdate({ id, participants, action }) {
    if (opts['self']) return
    if (global.isInit) return

    let chat = db.data.chats[id] || {}
    let text = ''

    switch (action) {
        case 'add':
        case 'remove':
        case 'leave':
        case 'invite':
        case 'invite_v4':
            if (chat.welcome) {
                let groupMetadata = await this.groupMetadata(id).catch(() => null)
                if (!groupMetadata) break

                for (let user of participants) {
                    let jid = user
                    if (typeof user === 'object') {
                        jid = user.phoneNumber || user.id || user.jid || user
                    }
                    if (!jid || (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid'))) continue

                    let pp = 'https://telegra.ph/file/70e8de9b1879568954f09.jpg'
                    try { pp = await this.profilePictureUrl(jid, 'image') } catch {}

                    const isAdd = ['add', 'invite', 'invite_v4'].includes(action)

                    text = (isAdd
                        ? (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!')
                        : (chat.sBye || this.bye || conn.bye || 'Bye, @user!'))
                        .replace('@subject', groupMetadata.subject || 'this group')
                        .replace('@desc', groupMetadata.desc?.toString() || '')
                        .replace('@user', '@' + jid.split('@')[0])

                    await this.sendMessage(id, {
                        text,
                        mentions: [jid]
                    })
			    /*
                    await this.sendMessage(id, {
                        text: text,
                        mentions: [jid],
                        contextInfo: {
                            externalAdReply: {
                                title: isAdd ? 'Selamat Datang' : 'Selamat Tinggal',
                                body: global.wm || 'Bot WhatsApp',
                                thumbnailUrl: pp,
                                sourceUrl: 'https://api.botcahx.eu.org',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    })
 */
                }
            }
            break            
            /**case 'promote':
            text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
            case 'demote':
            if (!text) text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
            text = text.replace('@user', '@' + participants[0].split('@')[0])
            if (chat.detect) this.sendMessage(id, { text }, { mentions: [participants[0]] })
            break**/
    }
},
    async delete({ remoteJid, fromMe, id, participant }) {
        /*if (fromMe) return
        let chats = Object.entries(conn.chats).find(([user, data]) => data.messages && data.messages[id])
        if (!chats) return
        let msg = JSON.parse(chats[1].messages[id])
        let chat = global.db.data.chats[msg.key.remoteJid] || {}
        if (chat.delete) return
        await this.reply(msg.key.remoteJid, `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(), msg, {
            mentions: [participant]
        })
        this.copyNForward(msg.key.remoteJid, msg).catch(e => console.log(e, msg))*/
    }
}

global.dfail = (type, m, conn) => {
    let msg = {
        rowner: '🚨 *𝙰𝙺𝚂𝙴𝚂 𝙳𝙸𝚃𝙾𝙻𝙰𝙺!* 𝙿𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒 𝚑𝚊𝚗𝚢𝚊 𝚞𝚗𝚝𝚞𝚔 *𝚁𝚘𝚘𝚝 𝙾𝚠𝚗𝚎𝚛* (𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 𝚄𝚝𝚊𝚖𝚊).',
        
    owner: '🚨 *𝙾𝚆𝙽𝙴𝚁 𝙾𝙽𝙻𝚈!* 𝙿𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒 𝚑𝚊𝚗𝚢𝚊 𝚍𝚊𝚙𝚊𝚝 𝚍𝚒𝚓𝚊𝚕𝚊𝚗𝚔𝚊𝚗 𝚘𝚕𝚎𝚑 *𝙾𝚠𝚗𝚎𝚛 𝙱𝚘𝚝* 𝚢𝚊𝚗𝚐 𝚝𝚎𝚛𝚍𝚊𝚏𝚝𝚊𝚛.',
        
    mods: '🧩 *𝙺𝙷𝚄𝚂𝚄𝚂 𝙼𝙾𝙳𝙴𝚁𝙰𝚃𝙾𝚁!* 𝙿𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒 𝚑𝚊𝚗𝚢𝚊 𝚞𝚗𝚝𝚞𝚔 𝙼𝚘𝚍𝚎𝚛𝚊𝚝𝚘𝚛 𝚛𝚎𝚜𝚖𝚒 𝚋𝚘𝚝.',
        
    premium: '💎 *𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝙾𝙽𝙻𝚈!* 𝙵𝚒𝚝𝚞𝚛 𝚒𝚗𝚒 𝚑𝚊𝚗𝚢𝚊 𝚞𝚗𝚝𝚞𝚔 𝚙𝚎𝚗𝚐𝚐𝚞𝚗𝚊 𝚙𝚛𝚎𝚖𝚒𝚞𝚖.\n\n𝚄𝚙𝚐𝚛𝚊𝚍𝚎 𝚍𝚎𝚗𝚐𝚊𝚗 *.𝚜𝚎𝚠𝚊* 𝚞𝚗𝚝𝚞𝚔 𝚊𝚔𝚜𝚎𝚜 𝚙𝚎𝚗𝚞𝚑.',
        
    group: '👥 *𝙼𝙾𝙳𝙴 𝙶𝚁𝚄𝙿!* 𝙹𝚊𝚕𝚊𝚗𝚔𝚊𝚗 𝚙𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒 𝚍𝚒 𝚍𝚊𝚕𝚊𝚖 𝚐𝚛𝚞𝚙.',
        
    private: '📩 *𝙼𝙾𝙳𝙴 𝙿𝚁𝙸𝚅𝙰𝚃𝙴!* 𝙹𝚊𝚕𝚊𝚗𝚔𝚊𝚗 𝚙𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒 𝚍𝚒 𝚌𝚑𝚊𝚝 𝚙𝚛𝚒𝚋𝚊𝚍𝚒 𝚋𝚘𝚝.',
        
    admin: '🛠️ *𝙰𝙳𝙼𝙸𝙽 𝙾𝙽𝙻𝚈!* 𝙷𝚊𝚗𝚢𝚊 𝙰𝚍𝚖𝚒𝚗 𝙶𝚛𝚞𝚙 𝚢𝚊𝚗𝚐 𝚍𝚊𝚙𝚊𝚝 𝚖𝚎𝚗𝚐𝚐𝚞𝚗𝚊𝚔𝚊𝚗 𝚙𝚎𝚛𝚒𝚗𝚝𝚊𝚑 𝚒𝚗𝚒.',
        
    botAdmin: '🤖 *𝙱𝙾𝚃 𝙱𝚄𝙺𝙰𝙽 𝙰𝙳𝙼𝙸𝙽!* 𝙹𝚊𝚍𝚒𝚔𝚊𝚗 𝚋𝚘𝚝 𝚜𝚎𝚋𝚊𝚐𝚊𝚒 𝙰𝚍𝚖𝚒𝚗 𝙶??𝚞𝚙 𝚝𝚎𝚛𝚕𝚎𝚋𝚒𝚑 𝚍𝚊𝚑𝚞𝚕𝚞.',
        
    unreg: '📝 *𝙱𝙴𝙻𝚄𝙼 𝚃𝙴𝚁𝙳𝙰𝙵𝚃𝙰𝚁!* 𝚂𝚒𝚕𝚊𝚔𝚊𝚗 𝚍𝚊𝚏𝚝𝚊𝚛 𝚞𝚗𝚝𝚞𝚔 𝚖𝚎𝚗𝚐𝚐𝚞𝚗𝚊𝚔𝚊𝚗 𝚏𝚒𝚝𝚞𝚛 𝚒𝚗𝚒.\n𝙺𝚎𝚝𝚒𝚔:\n*.𝚛𝚎𝚐 𝚗𝚊𝚖𝚊.𝚞𝚖𝚞𝚛*\n𝙲𝚘𝚗𝚝𝚘𝚑:\n *.𝚛𝚎𝚐 𝚏𝚎𝚋𝚛𝚢.𝟸𝟶*\n(𝚋𝚘𝚕𝚎𝚑 𝚍𝚒𝚜𝚊𝚖𝚊𝚛𝚔𝚊𝚗)',
        
    restrict: '🚫 *𝙵𝙸𝚃𝚄𝚁 𝙳𝙸𝙼𝙰𝚃𝙸𝙺𝙰𝙽!* 𝙵𝚒𝚝𝚞𝚛 𝚒𝚗𝚒 𝚜𝚎𝚍𝚊𝚗𝚐 𝚍𝚒𝚗𝚘𝚗𝚊𝚔𝚝𝚒𝚏𝚔𝚊𝚗 𝚘𝚕𝚎𝚑 𝚁𝚘𝚘𝚝 𝙾𝚠𝚗𝚎𝚛.'
    }[type]

    if (msg) {
        return m.reply(msg + '\n\n➤ *©Hitam*')
    }
}

let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    delete require.cache[file]
    if (global.reloadHandler) console.log(global.reloadHandler())
})
