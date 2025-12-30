// plugins/botcheck.js
// 🔍 Bot Self Check / Audit
// Azbry-MD | FebryWesker

const os = require('os')
const path = require('path')

let handler = async (m, { conn }) => {
  const pkg = require('../package.json')

  // ===== BASIC INFO =====
  const nodeVer = process.version
  const platform = `${os.platform()} (${os.arch()})`
  const cpu = os.cpus()[0]?.model || '-'
  const ramUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
  const ramTotal = (os.totalmem() / 1024 / 1024).toFixed(0)
  const uptime = clockString(process.uptime() * 1000)

  // ===== BAILEYS =====
  let baileysVer = '-'
  try {
    const b = require('@adiwajshing/baileys/package.json')
    baileysVer = b.version
  } catch {}

  // ===== ENTRY FILE =====
  const entryFile = process.argv[1]
    ? path.basename(process.argv[1])
    : '(unknown)'

  // ===== PLUGIN INFO =====
  const plugins = Object.values(global.plugins || {})
  const totalPlugin = plugins.length
  const disabledPlugin = plugins.filter(p => p.disabled).length
  const errorPlugin = plugins.filter(p => p.error).length

  // ===== GLOBAL FLAGS =====
  const globals = []
  if (global.thumbAd) globals.push('thumbAd')
  if (global.botLog) globals.push('botLog')
  if (global.__YTNEWS_LOOP_FINAL__) globals.push('ytnewsLoop')
  if (global.db) globals.push('database')

  const text = `
🤖 *BOT CHECK / AUDIT*

📦 *Core*
• Entry File : ${entryFile}
• Node.js    : ${nodeVer}
• Baileys    : ${baileysVer}
• Platform   : ${platform}

🧠 *System*
• CPU        : ${cpu}
• RAM        : ${ramUsed} MB / ${ramTotal} MB
• Uptime     : ${uptime}

🧩 *Plugin*
• Total      : ${totalPlugin}
• Disabled   : ${disabledPlugin}
• Error      : ${errorPlugin}

🌐 *Global State*
• Active     : ${globals.length ? globals.join(', ') : '-'}

🛡️ *Status*
• Bot Ready  : ${conn?.user ? 'YES' : 'NO'}
• Mode       : Multi-Device
`.trim()

  await conn.sendMessage(
    m.chat,
    { text },
    { quoted: m }
  )
}

handler.help = ['botcheck']
handler.tags = ['owner']
handler.command = /^(botcheck|audit|checkbot)$/i
handler.owner = true

module.exports = handler

// ===== UTIL =====
function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}