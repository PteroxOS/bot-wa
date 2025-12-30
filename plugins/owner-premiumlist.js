// plugins/premium-manage.js
// Info & Kontrol Premium User (Owner Only)
// Command: .premium info | list | scan | del

const TZ = 'Asia/Makassar'
const DAY_MS = 24 * 60 * 60 * 1000

function fmtDate(ts) {
  if (!ts || !Number.isFinite(ts)) return '-'
  try {
    return new Date(ts).toLocaleString('id-ID', {
      timeZone: TZ, hour12: false,
      year: 'numeric', month: 'long', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  } catch { return String(ts) }
}

function fmtLeft(ms) {
  if (!ms || ms <= 0) return '0 hari'
  const d = Math.floor(ms / DAY_MS)
  const h = Math.floor((ms % DAY_MS) / (60 * 60 * 1000))
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (d > 0) return `${d} hari ${h} jam`
  if (h > 0) return `${h} jam ${m} menit`
  return `${m} menit`
}

function ensureUsers() {
  const root = global.db ||= { data: { users: {} } }
  const data = root.data ||= { users: {} }
  return data.users ||= {}
}

function parseJid(x) {
  if (!x) return null
  const raw = String(x).replace(/[^\d]/g, '')
  if (!raw) return null
  let jid = raw
  if (jid.startsWith('0')) jid = '62' + jid.slice(1)
  if (!jid.endsWith('@s.whatsapp.net')) jid += '@s.whatsapp.net'
  return jid
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  const users = ensureUsers()
  const sub = (args[0] || '').toLowerCase()

  if (!sub) {
    return m.reply(
`📘 *Manajemen Premium*
${usedPrefix}premium info [@user|nomor]
${usedPrefix}premium list
${usedPrefix}premium scan
${usedPrefix}premium del <@user|nomor|index>`)
  }

  if (['list','scan','del'].includes(sub) && !isOwner)
    return m.reply('Khusus Owner.')

  // ========= INFO =========
  if (sub === 'info') {
    let target = m.sender
    if (m.mentionedJid?.length) target = m.mentionedJid[0]
    else if (args[1]) {
      const jid = parseJid(args[1]); if (jid) target = jid
    }

    const u = users[target] || { premium: false, premiumTime: 0 }
    const now = Date.now()
    const active = !!u.premium && (u.premiumTime || 0) > now
    const leftMs = (u.premiumTime || 0) - now

    const header = '╭───「  I N F O  P R E M I U M  」'
    const footer = '╰────────────────────────────'
    const txt =
`${header}
│ Pengguna : @${target.split('@')[0]}
│ Status   : ${active ? 'AKTIF ✅' : 'NON-AKTIF ❌'}
│ Hingga   : ${fmtDate(u.premiumTime || 0)}
│ Sisa     : ${active ? fmtLeft(leftMs) : '—'}
│
│ 💎 *Keunggulan Premium:*
│ • Limit Unlimited
│ • Akses semua fitur bot
│ • Bisa invite bot ke 1 grup gratis
│ • Prioritas respon & request fitur
${footer}`

    return conn.sendMessage(m.chat, { text: txt, mentions: [target] }, { quoted: m })
  }

  // helper untuk dapatkan list aktif (dipakai di list & del index)
  function getActiveRows() {
    const now = Date.now()
    return Object.entries(users)
      .filter(([_, u]) => u?.premium && (u.premiumTime || 0) > now)
      .map(([jid, u]) => ({
        jid,
        tag: `@${jid.split('@')[0]}`,
        left: (u.premiumTime || 0) - now,
        until: fmtDate(u.premiumTime || 0)
      }))
      .sort((a, b) => b.left - a.left)
  }

  // ========= LIST =========
  if (sub === 'list') {
    const rows = getActiveRows()
    if (!rows.length) return m.reply('❌ Tidak ada user premium aktif.')
    let txt = '╭───「  D A F T A R  P R E M I U M  」\n'
    rows.forEach((r, i) => { txt += `│ ${i + 1}. ${r.tag} — berakhir ${r.until}\n` })
    txt += '╰────────────────────────────'
    return conn.sendMessage(m.chat, { text: txt, mentions: rows.map(r => r.jid) }, { quoted: m })
  }

  // ========= SCAN =========
  if (sub === 'scan') {
    const now = Date.now()
    let off = 0
    for (const [jid, u] of Object.entries(users)) {
      if (u?.premium && (u.premiumTime || 0) <= now) {
        u.premium = false
        u.premiumTime = 0
        off++
      }
    }
    return m.reply(`✅ Selesai scan. ${off} user premium kedaluwarsa dinonaktifkan.`)
  }

  // ========= DEL =========
  if (sub === 'del') {
    // bentuk 1: mention/nomor
    let target =
      (m.mentionedJid && m.mentionedJid[0]) ||
      parseJid(args[1])

    // bentuk 2: index dari list aktif
    if (!target && args[1] && /^\d+$/.test(args[1])) {
      const idx = Math.max(1, parseInt(args[1])) - 1
      const rows = getActiveRows()
      if (rows[idx]) target = rows[idx].jid
      else return m.reply('❌ Index tidak valid. Lihat `.premium list` dulu.')
    }

    if (!target) return m.reply(`Gunakan format: ${usedPrefix}premium del <@user|nomor|index>`)
    if (!users[target]) users[target] = {}

    users[target].premium = false
    users[target].premiumTime = 0

    return conn.sendMessage(m.chat, {
      text: `🗑️ Premium *dihapus* untuk @${target.split('@')[0]}.`,
      mentions: [target]
    }, { quoted: m })
  }

  return m.reply(`Perintah tidak dikenal. Gunakan:
${usedPrefix}premium info | list | scan | del`)
}

handler.help = ['premium info', 'premium list', 'premium scan', 'premium del']
handler.tags = ['owner','info']
handler.command = /^premium$/i
handler.owner = true

module.exports = handler