// plugins/owner-upplugin.js
// Command: .upplugin <plugins/nama.js>
// Aksi: reply ke pesan berisi kode JS (teks atau dokumen .js) untuk update plugin.
// Fitur: backup lama, syntax-check, tulis file, hot-reload, rollback jika gagal.

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const PLUGINS_DIR = path.join(__dirname) // folder ini = plugins
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'plugins')

function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

function ts() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function safePluginPath(input) {
  // hanya izinkan di bawah folder plugins dan file .js
  let rel = input.replace(/^(\.\/)+/, '').trim()
  if (!rel.startsWith('plugins/')) rel = 'plugins/' + rel
  const base = path.basename(rel).replace(/[^a-zA-Z0-9._-]/g, '')
  if (!base.endsWith('.js')) throw new Error('Nama file harus berakhiran .js')
  const full = path.join(PLUGINS_DIR, base)
  // normalize + pastikan masih di folder plugins
  const resolved = path.resolve(PLUGINS_DIR, base)
  if (!resolved.startsWith(path.resolve(PLUGINS_DIR))) {
    throw new Error('Path tidak valid.')
  }
  return resolved
}

async function getQuotedCode(m, conn) {
  if (!m.quoted) throw new Error('Reply dulu ke pesan yang berisi kode.')
  // Prioritas: teks biasa
  let text = m.quoted.text || ''
  if (text && text.trim().length > 0) return text

  // Jika bukan teks, coba unduh dokumen/file (misal .js)
  if (m.quoted.mimetype) {
    const buf = await m.quoted.download()
    if (!buf) throw new Error('Gagal download file dari pesan yang direply.')
    return buf.toString('utf-8')
  }
  throw new Error('Pesan yang direply tidak berisi teks atau file.')
}

function syntaxCheck(code, filename = 'inline.js') {
  // cek sintaks cepat tanpa eksekusi
  new vm.Script(code, { filename })
}

function backupOld(file) {
  if (!fs.existsSync(file)) return null
  ensureDirs()
  const name = path.basename(file)
  const dest = path.join(BACKUP_DIR, `${name}.${ts()}.bak`)
  fs.copyFileSync(file, dest)
  return dest
}

function hotReload(file) {
  // hapus dari cache & load ulang
  try {
    const id = require.resolve(file)
    delete require.cache[id]
  } catch {}
  require(file)
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  if (!isOwner) return conn.reply(m.chat, 'Khusus Owner.', m)

  const hint = `Contoh:\n${usedPrefix}${command} plugins/level.js (reply ke kode plugin)`

  if (!args[0]) return conn.reply(m.chat, `Masukkan path file plugin.\n${hint}`, m)

  let target
  try {
    target = safePluginPath(args[0])
  } catch (e) {
    return conn.reply(m.chat, `❌ ${e.message}\n${hint}`, m)
  }

  let code
  try {
    code = await getQuotedCode(m, conn)
  } catch (e) {
    return conn.reply(m.chat, `❌ ${e.message}`, m)
  }

  // optional: jika ada penanda file di baris pertama: // file: plugins/nama.js
  const first = code.split('\n')[0]
  const mt = first.match(/^\s*\/\/\s*file:\s*(plugins\/[A-Za-z0-9._-]+\.js)\s*$/i)
  if (mt) {
    try { target = safePluginPath(mt[1]) } catch {}
  }

  // Syntax check
  try {
    syntaxCheck(code, path.basename(target))
  } catch (e) {
    return conn.reply(m.chat, `❌ Syntax error:\n${String(e.message)}`, m)
  }

  // Backup lama
  let backup = null
  try {
    backup = backupOld(target)
  } catch (e) {
    return conn.reply(m.chat, `❌ Gagal membuat backup: ${e.message}`, m)
  }

  // Tulis file baru
  try {
    fs.writeFileSync(target, code, 'utf-8')
  } catch (e) {
    return conn.reply(m.chat, `❌ Gagal menulis file: ${e.message}`, m)
  }

  // Hot reload + rollback jika gagal
  try {
    hotReload(target)
  } catch (e) {
    try {
      if (backup) fs.copyFileSync(backup, target) // rollback
    } catch {}
    return conn.reply(m.chat, `⚠️ Plugin ditulis tapi reload gagal:\n${String(e.message)}\nBackup: ${backup || '-'}`, m)
  }

  const size = Buffer.byteLength(code, 'utf-8')
  const lines = code.split('\n').length
  return conn.reply(
    m.chat,
    `✅ *Plugin updated & reloaded*\n• File: ${path.basename(target)}\n• Ukuran: ${size} B\n• Baris: ${lines}\n• Backup: ${backup ? path.basename(backup) : '(tidak ada)'}\n\nJika ada cache global lain, pertimbangkan restart bot.`,
    m
  )
}

handler.help = ['upplugin <plugins/nama.js> *(reply ke kode)*']
handler.tags = ['owner']
handler.command = /^(upplugin|updateplugin|pluginupdate|upp|uplg)$/i
handler.owner = true

module.exports = handler