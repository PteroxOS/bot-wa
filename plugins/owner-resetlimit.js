// plugins/limit-admin.js
const fs = require('fs')

// ==== KONFIG ====
const LIMIT_HARIAN = 10
const ZONA_WAKTU = 'Asia/Makassar' // WITA
const MAX_FREE_LIMIT_CAP = 20      // pagar pengaman; bebas kamu set
const USE_CRON = true

// === safe require cron ===
function safeRequire(name) {
  try { return require(name) } catch { return null }
}
const cron = USE_CRON ? safeRequire('node-cron') : null

// ==== UTIL ====
function clampNumber(n, min = 0, max = MAX_FREE_LIMIT_CAP) {
  n = Number.isFinite(+n) ? +n : 0
  if (max != null) n = Math.min(n, max)
  if (min != null) n = Math.max(n, min)
  return n
}
function normalizeUser(u) {
  if (!u) return
  // pastikan properti penting ada
  if (!('limit' in u)) u.limit = 0
  // kalau premiumTime valid & aktif → jangan clamp ke MAX_FREE_LIMIT_CAP
  const premiumAktif = !!u.premium || (Number(u.premiumTime) > Date.now())
  u.limit = premiumAktif ? Math.max(0, Number(u.limit)||0) : clampNumber(u.limit)
}

// ==== COMMAND ====
let handler = async (m, { conn, args, command }) => {
  const users = global.db?.data?.users
  if (!users) return m.reply('⚠️ Database user kosong atau belum terbentuk.')

  // normalisasi cepat (sekalian “healing” data anomali)
  for (const u of Object.values(users)) normalizeUser(u)

  if (/^resetlimit$/i.test(command)) {
    for (const u of Object.values(users)) {
      const premiumAktif = !!u.premium || (Number(u.premiumTime) > Date.now())
      u.limit = premiumAktif ? (Number(u.limit)||0) : LIMIT_HARIAN
    }
    return m.reply(`✅ Limit semua user (non-premium) direset ke *${LIMIT_HARIAN}*/hari.`)
  }

  if (/^cleardb$/i.test(command)) {
    const jumlah = Object.keys(users).length
    global.db.data.users = {}
    return m.reply(`🗑️ Database user dikosongkan (${jumlah} user dihapus).`)
  }

  if (/^listlimit$/i.test(command)) {
    if (!Object.keys(users).length) return m.reply('❌ Tidak ada data user.')

    // bikin array & urutkan desc
    const arr = Object.entries(users).map(([jid, u]) => ({
      jid,
      limit: Number.isFinite(+u.limit) ? +u.limit : 0
    })).sort((a,b) => b.limit - a.limit)

    let teks = '📋 *Daftar User & Sisa Limit (Top → Bottom)*\n\n'
    arr.forEach((row, i) => {
      const num = row.jid.split('@')[0]
      teks += `${i+1}. wa.me/${num} → ${row.limit}\n`
    })

    return conn.reply(m.chat, teks.trim(), m)
  }
}

handler.help = ['resetlimit','cleardb','listlimit']
handler.tags = ['owner']
handler.command = /^(resetlimit|cleardb|listlimit)$/i
handler.owner = true
module.exports = handler

// ==== RESET HARIAN ====
function doDailyReset() {
  try {
    const users = global.db?.data?.users
    if (!users) return
    for (const u of Object.values(users)) {
      const premiumAktif = !!u.premium || (Number(u.premiumTime) > Date.now())
      u.limit = premiumAktif ? (Number(u.limit)||0) : LIMIT_HARIAN
      normalizeUser(u)
    }
    console.log(`[AUTO RESET LIMIT] Sukses @ ${new Date().toISOString()} | Zona: ${ZONA_WAKTU}`)
  } catch (e) {
    console.error('[AUTO RESET LIMIT ERR]', e?.message)
  }
}

// Pakai cron kalau ada
if (cron) {
  // menit jam * * * di TZ WITA
  cron.schedule('0 0 * * *', doDailyReset, { timezone: ZONA_WAKTU })
} else {
  // fallback: interval + guard (reset sekali/hari)
  let lastKey = ''
  setInterval(() => {
    try {
      const now = new Date()
      const d = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_WAKTU, year:'numeric', month:'2-digit', day:'2-digit' }).format(now) // YYYY-MM-DD
      if (d !== lastKey) {
        lastKey = d
        doDailyReset()
      }
    } catch (e) {}
  }, 60 * 1000)
}