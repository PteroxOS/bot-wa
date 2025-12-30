// plugins/giveaway-dana.js
// Giveaway dengan efek dramatis (putaran lambat + pengumuman keren)

const COOLDOWN_MS = 5 * 60 * 1000 // 5 menit
const ROUNDS = 3
const NAMES_PER_ROUND = 6
const ROUND_DELAY_MS = 2500 // jeda antar putaran (lebih lama)
const COUNTDOWN_DELAY = 1000 // 1 detik per hitung mundur

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(a) {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function pickN(arr, n) { return shuffle(arr).slice(0, Math.min(n, arr.length)) }

module.exports = async (m, { conn, args, isOwner }) => {
  if (!m.chat.endsWith('@g.us')) return m.reply('Hanya untuk grup.')

  global.__giveaway_cooldown = global.__giveaway_cooldown || new Map()
  const last = global.__giveaway_cooldown.get(m.chat) || 0
  const now = Date.now()
  if (now - last < COOLDOWN_MS)
    return m.reply(`⏳ Sabar… tunggu ${(Math.ceil((COOLDOWN_MS - (now - last)) / 1000))} detik lagi.`)

  // izin admin/owner
  let isAdmin = !!isOwner
  if (!isAdmin) {
    try {
      const meta = await conn.groupMetadata(m.chat)
      const sender = meta.participants.find(p => (p.id || p.jid) === m.sender)
      isAdmin = sender && (sender.admin === 'admin' || sender.admin === 'superadmin' || sender.isAdmin)
    } catch {}
  }
  if (!isAdmin) return m.reply('Fitur ini hanya untuk admin atau owner.')

  // peserta grup
  let parts = []
  try {
    const meta = await conn.groupMetadata(m.chat)
    parts = meta.participants.map(p => p.id || p.jid).filter(Boolean)
  } catch {}
  const me = (conn.user && (conn.user.id || conn.user.jid)) || ''
  parts = Array.from(new Set(parts))
    .map(j => j.includes('@') ? j : j + '@s.whatsapp.net')
    .filter(j => j !== me && j !== me.replace(/:/g, '@'))
  if (!parts.length) return m.reply('Tidak ada peserta di grup ini.')

  const prize = args.length ? args.join(' ') : 'Dana Kaget'

  await conn.sendMessage(m.chat, { text: `🎁 *GIVEAWAY DIMULAI!* 🎁\n\nHadiah: *${prize}*\n\nMenyiapkan nama-nama kandidat...` }, { quoted: m })

  // tiga putaran dengan tempo makin lambat
  for (let i = 1; i <= ROUNDS; i++) {
    const sample = pickN(parts, NAMES_PER_ROUND)
    const daftar = sample.map(j => `@${j.split('@')[0]}`).join(', ')
    const mentions = sample
    await sleep(ROUND_DELAY_MS * i) // makin lama tiap putaran
    await conn.sendMessage(m.chat, {
      text: `🎰 *Putaran ${i}/${ROUNDS}*\n\nYang masih berpeluang menang:\n${daftar}\n\n(putaran selanjutnya...)`,
      mentions
    })
  }

  // countdown lambat
  await sleep(3000)
  await conn.sendMessage(m.chat, { text: '🔥 *Hitung Mundur!* 🔥' })
  for (let i of ['3…', '2…', '1…']) {
    await sleep(COUNTDOWN_DELAY)
    await conn.sendMessage(m.chat, { text: i })
  }
  await sleep(1500)

  // pilih pemenang
  const winner = randItem(parts)

  const msg = 
`┏━━━━━━━━━━━━━━━━━━━━━┓
┃  🎉  PEMENANG DAGET  🎉
┗━━━━━━━━━━━━━━━━━━━━━┛

Selamat *@${winner.split('@')[0]}* 🎊
Kamu berhasil memenangkan *${prize}*!

📩 Cara klaim:
Hubungi admin/owner grup & tunjukkan chat ini.

Terima kasih untuk semua yang ikut!
Tetap pantau grup ini untuk giveaway berikutnya 💸`

  await conn.sendMessage(m.chat, { text: msg, mentions: [winner] })

  global.__giveaway_cooldown.set(m.chat, Date.now())
}

module.exports.help = ['giveaway <hadiah>', 'acakdana <hadiah>']
module.exports.tags = ['group', 'fun']
module.exports.command = /^(giveaway|acakdana)$/i
module.exports.admin = true
module.exports.group = true
module.exports.owner = false