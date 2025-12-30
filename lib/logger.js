// lib/logger.js
const chalk = require('chalk')
const os = require('os')

const line = chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// ===============================
// BANNER
// ===============================
function banner() {
  console.clear()

  console.log(chalk.cyanBright(`
██████╗  ██████╗ ████████╗      ██╗    ██╗ █████╗ 
██╔══██╗██╔═══██╗╚══██╔══╝      ██║    ██║██╔══██╗
██████╔╝██║   ██║   ██║         ██║ █╗ ██║███████║
██╔══██╗██║   ██║   ██║         ██║███╗██║██╔══██║
██████╔╝╚██████╔╝   ██║         ╚███╔███╔╝██║  ██║
╚═════╝  ╚═════╝    ╚═╝          ╚══╝╚══╝ ╚═╝  ╚═╝
`))

  console.log(chalk.bold.white('BOT-WA — WhatsApp Automation Engine'))
  console.log(chalk.gray('Fast • Modular • Stable • Production Ready'))
  console.log(line)
}

// ===============================
// SYSTEM INFO
// ===============================
function systemInfo() {
  info('Platform', `${os.platform()} ${os.arch()}`)
  info('Node.js', process.version)
  info('CPU', os.cpus()[0]?.model || 'Unknown CPU')
  info('RAM', `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`)
  info('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
  console.log(line)
}

// ===============================
// LOG LEVELS
// ===============================
function info(label, value = '') {
  console.log(
    chalk.green('✔'),
    chalk.white(label.padEnd(12)),
    chalk.gray(':'),
    chalk.cyan(value)
  )
}

function warn(label, value = '') {
  console.log(
    chalk.yellow('⚠'),
    chalk.yellow(label.padEnd(12)),
    chalk.gray(':'),
    chalk.yellow(value)
  )
}

function error(label, value = '') {
  console.log(
    chalk.red('✖'),
    chalk.red(label.padEnd(12)),
    chalk.gray(':'),
    chalk.red(value)
  )
}

// ===============================
// EXPORT
// ===============================
module.exports = {
  banner,
  systemInfo,
  info,
  warn,
  error,
  line
}
