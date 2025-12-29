global.owner = []
global.mods  = []
global.prems = []

global.nameowner = ''
global.numberowner = ''
global.mail = ''
global.web = ''
global.gc = ''
global.instagram = ''

global.wm = ''
global.wait = ''
global.eror = ''
global.stiker_wait = ''

global.packname = ''
global.author = ''

global.maxwarn = 5
global.autobio = false
global.antiporn = false
global.spam = false
global.gcspam = false

global.btc = ''
global.aksesKey = ''
global.lann = ''

global.APIs = {
  btc: 'https://api.botcahx.eu.org',
  lann: 'https://api.betabotz.eu.org'
}

global.APIKeys = {
  'https://api.botcahx.eu.org': global.btc,
  'https://api.betabotz.eu.org': global.lann
}

const fs = require('fs')
const chalk = require('chalk')
const file = require.resolve(__filename)

fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Config updated"))
  delete require.cache[file]
  require(file)
})
