const fs = require('fs')
const path = require('path')

let handler = async (m, { conn }) => {
  try {
    const src = path.join(process.cwd(), 'database.json')

    if (!fs.existsSync(src)) {
      return m.reply('❌ File database.json tidak ditemukan')
    }

    const backupName = `database-backup-${Date.now()}.json`
    const backupPath = path.join(process.cwd(), backupName)

    // copy database
    fs.copyFileSync(src, backupPath)

    // kirim file ke chat
    await conn.sendMessage(
      m.chat,
      {
        document: fs.readFileSync(backupPath),
        fileName: backupName,
        mimetype: 'application/json'
      },
      { quoted: m }
    )

    // optional: hapus file backup setelah dikirim
    fs.unlinkSync(backupPath)

  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal membuat / mengirim backup database')
  }
}

handler.help = ['backupdb']
handler.tags = ['owner']
handler.command = /^backupdb$/i
handler.owner = true

module.exports = handler