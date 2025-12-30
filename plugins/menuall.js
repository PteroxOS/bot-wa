// plugins/menuall.js
// Bot-WA • Full Menu Unlimited (ONE CHAT, ONE BUTTON, SAFE)

const fs = require('fs')
const path = require('path')
process.env.TZ = 'Asia/Jakarta'

// ===============================
// IDENTITAS BOT
// ===============================
const BOT_NAME = 'Bot-WA'
const DEVELOPER = 'Hitam'
const SCRIPT_URL = 'https://github.com' // bebas lu ganti
const BANNER_URL = 'https://cdn.jsdelivr.net/gh/vandebry-img/img@main/card.png'
const AUDIO_PATH = path.join(__dirname, '../media/sound/menu.mp3')

const readMore = String.fromCharCode(8206).repeat(4001)

// ================= ICON TAG =================
const allTags = {
  ai:'🤖 AI', main:'🧭 MAIN', downloader:'📥 DOWNLOAD',
  database:'💾 DB', sticker:'🎨 STICKER', advanced:'⚙️ ADVANCED',
  xp:'🏅 LEVEL', fun:'🎭 FUN', game:'🎮 GAME', github:'🐙 GITHUB',
  group:'👥 GROUP', info:'📚 INFO', internet:'🌐 INTERNET', islam:'🕌 ISLAM',
  kerang:'🐚 KERANG', maker:'🧩 MAKER', news:'📰 NEWS', owner:'👑 OWNER',
  voice:'🎤 VOICE', quotes:'💬 QUOTES', store:'🏪 STORE', stalk:'🔍 STALK',
  shortlink:'🔗 SHORTLINK', tools:'🛠️ TOOLS', anonymous:'🎭 ANONYMOUS',
  premium:'💎 PREMIUM', vote:'🗳️ VOTE', rpg:'⚔️ RPG', music:'🎵 MUSIC'
}

// ================= HELPER =================
function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function buildCategories() {
  const tags = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .flatMap(pl => Array.isArray(pl.tags) ? pl.tags : pl.tags ? [pl.tags] : [])
  return [...new Set(tags.filter(Boolean))].sort()
}

// ================= HANDLER =================
let handler = async (m, { conn, usedPrefix: p }) => {
  // audio menu (opsional & aman)
  try {
    if (fs.existsSync(AUDIO_PATH)) {
      await conn.sendMessage(
        m.chat,
        { audio: { url: AUDIO_PATH }, mimetype: 'audio/mp4' },
        { quoted: m }
      )
    }
  } catch {}

  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help: Array.isArray(pl.help) ? pl.help : (pl.help ? [pl.help] : []),
      tags: Array.isArray(pl.tags) ? pl.tags : (pl.tags ? [pl.tags] : []),
      prefix: 'customPrefix' in pl,
      limit: pl.limit,
      premium: pl.premium
    }))

  const categories = buildCategories()
  const name = conn.getName(m.sender) || m.sender.split('@')[0]
  const uptime = clockString(process.uptime() * 1000)

  let text = `👋 Halo kak ${name}

╭──❏「 ALL MENU 」
│ 🤖 Bot     : ${BOT_NAME}
│ 👑 Owner   : ${DEVELOPER}
│ 🕐 Runtime : ${uptime}
│ 📋 Kategori: ${categories.length}
│ 📝 Script  : ${SCRIPT_URL}
╰───────────╯

Semua Menu ⬇️
${readMore}\n`

  for (const cat of categories) {
    const title = allTags[cat] || cat.toUpperCase()
    const cmds = helps.filter(x => x.tags.includes(cat) && x.help.length)
    if (!cmds.length) continue

    text += `╭──❏「 ${title} 」\n`

    const rows = []
    for (const c of cmds) {
      for (const h of c.help) {
        if (!h) continue
        rows.push(
          `├ ➤ ${c.prefix ? h : p + h} ${c.limit ? 'Ⓛ' : ''}${c.premium ? 'Ⓟ' : ''}`
        )
      }
    }

    rows.sort()
    text += rows.join('\n') + '\n'
    text += `╰───────────╯\n\n`
  }

  text += `╭──❏「 INFO 」
│ Ⓛ = Limit | Ⓟ = Premium
│ Gunakan: ${p}<command>
│ ${p}menu untuk menu interaktif
╰───────────╯`

  await conn.sendButtonNativeFlow(
    m.chat,
    {
      caption: text,
      footer: `${BOT_NAME} • Full Menu`,
      buttons: [
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '📜 Menu Interaktif',
            id: `${p}menu`
          })
        }
      ]
    },
    {
      quoted: m,
      mentions: [m.sender],
      contextInfo: {
        externalAdReply: {
          title: `${BOT_NAME} • All Menu`,
          body: `${categories.length} Kategori • Lengkap`,
          thumbnailUrl: BANNER_URL,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }
  )
}

handler.help = ['menuall', 'allmenu', 'helpall']
handler.tags = ['main']
handler.command = /^(menuall|allmenu|helpall)$/i
handler.exp = 3
handler.register = false

module.exports = handler
