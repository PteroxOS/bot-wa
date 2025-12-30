// plugins/backupplugin.js
// .backupplugin — zip folder plugins lalu kirim (owner-only)

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const ROOT_DIR = path.join(__dirname, '..')
const PLUGINS_DIR = __dirname
const ZIP_NAME = () => `BackupPlugins_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
const EXCLUDES = [
  'node_modules/*',
  '.git/*',
  '*.zip',
  '*.log',
  'backups/*'
]

// coba kirim file zip
async function sendZip(conn, m, zipPath, fileName) {
  if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
    throw new Error('ZIP tidak ditemukan atau kosong.')
  }
  await conn.sendMessage(
    m.chat,
    {
      document: fs.readFileSync(zipPath),
      mimetype: 'application/zip',
      fileName,
      caption: '✅ Backup plugin selesai. Silakan unduh file.'
    },
    { quoted: m }
  )
}

// fallback pakai archiver kalau util `zip` ga ada
async function zipWithArchiver(srcDir, destZip) {
  const archiver = require('archiver')
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(destZip)
    const arc = archiver('zip', { zlib: { level: 9 } })
    out.on('close', resolve)
    arc.on('error', reject)
    arc.pipe(out)
    // zip hanya .js (umumnya plugin), plus md/json opsional
    arc.glob('**/*.js', { cwd: srcDir })
    arc.glob('**/*.json', { cwd: srcDir })
    arc.glob('**/*.md', { cwd: srcDir })
    arc.finalize()
  })
}

let handler = async (m, { conn, isOwner }) => {
  try {
    if (!isOwner) return m.reply('⚠️ Perintah ini khusus owner.')

    const fileName = ZIP_NAME()
    const zipPath = path.join(ROOT_DIR, fileName)

    await m.reply('⏳ Membuat backup folder *plugins/*...')

    // coba pakai util `zip` dulu
    const excludeArgs = EXCLUDES.map(x => `-x "${x}"`).join(' ')
    // jalankan zip dari dalam folder plugins/ biar path bersih
    const cmd = `zip -r "${zipPath}" . ${excludeArgs}`
    try {
      await execAsync(cmd, { cwd: PLUGINS_DIR, timeout: 60_000 })
    } catch (e) {
      // kalau util `zip` ga ada / error → fallback archiver
      try {
        await zipWithArchiver(PLUGINS_DIR, zipPath)
      } catch (e2) {
        return m.reply('❌ Gagal membuat ZIP. Install util `zip` atau `npm i archiver`.')
      }
    }

    await sendZip(conn, m, zipPath, fileName)

    // hapus file setelah terkirim
    setTimeout(() => {
      try { fs.unlinkSync(zipPath) } catch {}
    }, 5000)
  } catch (err) {
    console.error('[backupplugin]', err)
    m.reply('❌ Terjadi kesalahan saat backup: ' + (err.message || err))
  }
}

handler.help = ['backupplugin']
handler.tags = ['owner']
handler.command = /^backupplugin$/i
handler.owner = true

module.exports = handler