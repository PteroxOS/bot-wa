global.owner = ['628']
global.mods  = ['628']
global.prems = ['628']

global.nameowner = 'Hitam'
global.numberowner = '628'
global.mail = 'dev.id'
global.web = 'dev.id'
global.gc = 'https'
global.instagram = 'hitam'

global.wm = 'Bot-WA'
global.wait = 'Please wait a moment..'
global.stiker_wait = 'sticker is being created, wait a moment'

global.packname = 'Bot-WA'
global.author = 'Hitam'

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
