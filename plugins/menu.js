// plugins/menu.js
// Bot-WA • Menu Utama (Optimized + Cached)

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Jakarta'

// ===============================
// IDENTITAS BOT
// ===============================
const BOT_NAME = 'Bot-WA'
const DEVELOPER = 'Hitam'
const readMore = String.fromCharCode(8206).repeat(1500)

// ===============================
// CACHE (ANTI CPU SPIKE)
// ===============================
const MENU_CACHE = {
  time: 0,
  categories: null,
  helps: null
}
const CACHE_TTL = 60 * 1000 // 1 menit

// ===============================
// HELPER
// ===============================
function clockString(ms) {
  if (isNaN(ms)) return '--:--:--'
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function getAllCategoriesCached() {
  if (MENU_CACHE.categories && Date.now() - MENU_CACHE.time < CACHE_TTL) {
    return MENU_CACHE.categories
  }

  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help: Array.isArray(pl.help) ? pl.help : [],
      tags: Array.isArray(pl.tags) ? pl.tags : []
    }))

  const tags = new Set()
  for (const h of helps) {
    if (!h.help.length) continue
    for (const t of h.tags) if (t) tags.add(t)
  }

  MENU_CACHE.categories = Array.from(tags)
  MENU_CACHE.time = Date.now()
  return MENU_CACHE.categories
}

function getHelpsCached() {
  if (MENU_CACHE.helps && Date.now() - MENU_CACHE.time < CACHE_TTL) {
    return MENU_CACHE.helps
  }

  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      help: Array.isArray(pl.help) ? pl.help : [],
      tags: Array.isArray(pl.tags) ? pl.tags : [],
      prefix: 'customPrefix' in pl,
      limit: pl.limit,
      premium: pl.premium
    }))

  MENU_CACHE.helps = helps
  MENU_CACHE.time = Date.now()
  return helps
}

// ===============================
// KATEGORI UNGGULAN
// ===============================
const FEATURED = ['main', 'downloader', 'ai', 'group', 'sticker', 'game', 'rpg']

// ===============================
// HANDLER
// ===============================
let handler = async (m, { conn, usedPrefix: p, args }) => {
  const sub = (args[0] || '').toLowerCase()
  const name = m.name || 'kak'

  // ===============================
  // MENU UTAMA
  // ===============================
  if (!sub || sub === 'all') {
    const uptime = clockString(process.uptime() * 1000)
    const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY')
    const time = moment.tz('Asia/Jakarta').format('HH:mm:ss')

    const allCats = getAllCategoriesCached()
    const featuredCats = allCats.filter(c => FEATURED.includes(c))
    const otherCats = allCats.filter(c => !FEATURED.includes(c))

    let textMenu = `✨ *KATEGORI UNGGULAN*\n`
    textMenu += featuredCats.map(c => `➤ ${p}botwa ${c}`).join('\n')

    if (otherCats.length) {
      textMenu += `\n\n📂 *KATEGORI LAINNYA*\n`
      textMenu += otherCats.map(c => `➤ ${p}botwa ${c}`).join('\n')
    }

    textMenu += `\n\n📌 *MENU TAMBAHAN*\n`
    textMenu += `➤ ${p}menuall\n`
    textMenu += `➤ ${p}sc`

    const sections = []

    if (featuredCats.length) {
      sections.push({
        title: '✨ KATEGORI UNGGULAN',
        rows: featuredCats.map(c => ({
          title: `BOT-WA ${c.toUpperCase()}`,
          description: `Fitur utama kategori ${c}`,
          id: `${p}botwa ${c}`
        }))
      })
    }

    if (otherCats.length) {
      sections.push({
        title: '📂 KATEGORI LAINNYA',
        rows: otherCats.map(c => ({
          title: `BOT-WA ${c.toUpperCase()}`,
          description: `Fitur kategori ${c}`,
          id: `${p}botwa ${c}`
        }))
      })
    }

    sections.push({
      title: '📌 INFO & LAINNYA',
      rows: [
        { title: '📜 Semua Menu', description: 'Tampilkan semua command', id: `${p}menuall` },
        { title: '📦 Script Bot', description: 'Info script & produk', id: `${p}sc` }
      ]
    })

    return conn.sendButtonNativeFlow(
      m.chat,
      {
        caption:
`👋 Halo ${name}!

Selamat datang di *${BOT_NAME}* 🤖

⏱ Runtime : ${uptime}
📅 Date    : ${date}
🕒 Time    : ${time} WIB

━━━━━━━━━━━━━━━━━━
⬇️ *DAFTAR MENU BOT-WA*
${readMore}
${textMenu}

━━━━━━━━━━━━━━━━━━
💡 Gunakan tombol di bawah biar lebih cepat 👇`,
        footer: `Developed by ${DEVELOPER}`,
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: '📑 PILIH MENU',
              sections
            })
          },
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '👤 Owner',
              id: `${p}owner`
            })
          }
        ]
      },
      { quoted: m }
    )
  }

  // ===============================
  // MENU PER KATEGORI
  // ===============================
  const helps = getHelpsCached()
  const cmds = helps.filter(x => x.tags.includes(sub) && x.help.length)

  if (!cmds.length) {
    return m.reply(`❌ Menu *${sub}* tidak tersedia.\nGunakan ${p}menu`)
  }

  let out = `╭──❏「 BOT-WA ${sub.toUpperCase()} 」\n╰───────────╯\n\n`
  const rows = []

  for (const c of cmds) {
    for (const h of c.help) {
      let cmd = c.prefix ? h : p + h
      rows.push(`├ ➤ ${cmd} ${c.limit ? 'Ⓛ' : ''}${c.premium ? 'Ⓟ' : ''}`)
    }
  }

  out += rows.sort().join('\n')
  out += `\n\n📌 Total: ${rows.length} perintah`
  return m.reply(out)
}

// ===============================
handler.help = ['menu', 'botwa']
handler.tags = ['main']
handler.command = /^(menu|botwa)$/i
handler.exp = 3
handler.register = false

module.exports = handler
