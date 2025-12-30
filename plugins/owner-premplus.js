// plugins/prembenefit.js
// Menampilkan benefit & keunggulan user premium

const TZ = 'Asia/Makassar'
const DAY_MS = 24 * 60 * 60 * 1000

function fmtDate(ts) {
  if (!ts || !Number.isFinite(ts)) return '-'
  try {
    return new Date(ts).toLocaleString('id-ID', {
      timeZone: TZ,
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch { return String(ts) }
}

function fmtLeft(ms) {
  if (!ms || ms <= 0) return '0 hari'
  const d = Math.floor(ms / DAY_MS)
  const h = Math.floor((ms % DAY_MS) / (60 * 60 * 1000))
  if (d > 0) return `${d} hari ${h} jam`
  return `${Math.ceil(ms / (60 * 1000))} menit`
}

let handler = async (m, { conn }) => {
  const users = global.db.data.users
  const u = users[m.sender] || { premium: false, premiumTime: 0 }
  const now = Date.now()
  const active = !!u.premium && (u.premiumTime || 0) > now

  const status = active ? '🟢 AKTIF JIR' : '🔴 HUU GAK PREM'
  const until = fmtDate(u.premiumTime || 0)
  const sisa = active ? fmtLeft((u.premiumTime || 0) - now) : '—'

  const txt = `
╭───「  P R E M I U M  I N F O  」 
│ Pengguna : @${m.sender.split('@')[0]}
│ Status   : ${status}
│ Berlaku  : ${until}
│ Sisa     : ${sisa}
│
│  🎯 *Keunggulan Premium User:*
│  • Limit harian: *Unlimited*
│  • Akses semua perintah bertanda (Ⓟ) (cek di .menuall)
│  • Waktu respon lebih cepat
│  • Bisa pakai fitur eksklusif AI
│
│ mw jadi user premium? cek di web resmi:
│ *https://azbrybuy.vercel.app*
│
╰──────────────────────────`

  await conn.sendMessage(m.chat, {
    text: txt,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['prembenefit', 'benefit']
handler.tags = ['info']
handler.command = /^(prembenefit|benefit)$/i

module.exports = handler