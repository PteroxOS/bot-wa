let handler = async (m, { conn, command }) => {
  // Kalau perintahnya .getid
  if (command === 'getid') {
    if (!m.isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup!');
    let id = m.chat;
    m.reply(`🆔 ID Grup ini adalah:\n${id}`);
    console.log(`[GETID] Grup ID: ${id}`);
  }

  // Kalau perintahnya .listgroup
  if (command === 'listgroup') {
    let groups = Object.entries(conn.chats)
      .filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats)
      .map(([jid, chat], i) => `${i + 1}. ${chat.subject || 'Tanpa Nama'}\nID: ${jid}`)
      .join('\n\n');

    if (!groups) return m.reply('❌ Bot belum tergabung di grup manapun.');

    m.reply(`📜 *Daftar Grup yang Bot Ikuti:*\n\n${groups}`);
    console.log('[LISTGROUP]\n' + groups);
  }
};

// Daftar perintah yang bisa digunakan
handler.help = ['getid', 'listgroup'];
handler.tags = ['info'];
handler.command = ['getid', 'listgroup'];
handler.owner = true; // kalau mau hanya owner bisa, ubah ke false biar umum

module.exports = handler;