let handler = async (m, { conn, usedPrefix, command }) => {
  const quoted = m.quoted ? m.quoted : m
  const mime = (quoted.msg || quoted).mimetype || ''

  // ambil caption setelah command
  const text = m.text.replace(
    new RegExp(`^[.!#/](${command})\\s*`, 'i'),
    ''
  ).trim()

  const jid = m.chat

  try {
    if (!mime && !text) {
      return m.reply(
        `Gunakan dengan:\n` +
        `• ${usedPrefix + command} teks\n` +
        `• Reply gambar / video + ${usedPrefix + command} caption`
      )
    }

    let payload = {}

    if (/image/.test(mime)) {
      const buffer = await quoted.download()
      if (!buffer) throw 'Gagal download gambar'

      payload = {
        image: buffer,
        caption: text || ''
      }

    } else if (/video/.test(mime)) {
      const buffer = await quoted.download()
      if (!buffer) throw 'Gagal download video'

      payload = {
        video: buffer,
        caption: text || ''
      }

    } else if (/audio/.test(mime)) {
      const buffer = await quoted.download()
      if (!buffer) throw 'Gagal download audio'

      payload = {
        audio: buffer,
        mimetype: 'audio/mp4'
      }

    } else if (text) {
      payload = { text }
    }

    await conn.sendGroupStatus(jid, payload)
    m.reply('✅ Status grup berhasil dikirim')

  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal mengirim status grup')
  }
}

handler.help = ['swgc', 'statusgc']
handler.tags = ['owner']
handler.command = /^(swgc|statusgc)$/i
handler.owner = true
handler.group = true

module.exports = handler