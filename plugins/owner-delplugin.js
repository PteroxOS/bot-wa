const fs = require('fs')
const path = require('path')

let handler = async (m, { text, isROwner }) => {
  if (!isROwner) throw 'Khusus owner utama.'

  if (!text) throw 'Nama pluginnya mana?\nContoh: .delplugin welcome.js'

  // normalisasi nama file
  let fileName = text.endsWith('.js') ? text : `${text}.js`

  // path absolut folder plugins
  let pluginPath = path.join(process.cwd(), 'Azbry-MD', fileName)

  // security check
  if (!pluginPath.startsWith(path.join(process.cwd(), 'Azbry-MD')))
    throw 'Akses ditolak.'

  if (!fs.existsSync(pluginPath))
    throw `Plugin *${fileName}* tidak ditemukan.`

  fs.unlinkSync(pluginPath)

  m.reply(`Plugin *${fileName}* berhasil dihapus.\nRestart bot untuk apply.`)
}

handler.help = ['delplugin <nama.js>']
handler.tags = ['owner']
handler.command = /^delplugin$/i

module.exports = handler